var settings = settings || {};
var fields = ['Id', 'CreatedDate'];
var soqlOrderer = '';
var soqlLimit = '';
var limit = 0;
var taskRelation;
var eventRelation;

// Settings proccessing
// Handle settings that have different names but same meaning!
if (settings.shouldFilterOnFutureActivity) {
  settings.activityFilterType = 'without';
}


// Build the SOQL query filter
var filter = []
if (settings.filter) {  
  filter.push(RuntimeHelpers.parseQuery(settings.filter, context));
}
if (!settings.adminmode) {
  filter.push("OwnerId='" + context.user.id + "'");
}

if (settings.limit != 0) {
  // Control the limit from settings or default it to 150
  limit = (settings.limit || 150);
  soqlLimit = " LIMIT " + limit
}

// Handle sorting and ordering
if (settings.orderfield) {
  fields.push(settings.orderfield);
  var orderByField = settings.orderfield;
  var orderByOrder = settings.orderdir || 'DESC';
  soqlOrderer = orderByField + ' ' + orderByOrder;
}

// Build list of fields to query
if (settings.fields) {
  var trimedExtrafields = [];
  _.each(settings.fields.split(','), function (s) {
    trimedExtrafields.push($.trim(s))
  });
  fields = fields.concat(trimedExtrafields);
}
if (settings.userFields) {
  fields = fields.concat(settings.userFields);
}
if (settings.itemtitle) {
  fields.push($.trim(settings.itemtitle));
}
if (settings.itemsubtitle) {
  fields.push($.trim(settings.itemsubtitle));
}
if (settings.bucketField) {
  fields.push(settings.bucketField);
}

// Remove any duplicates
fields = _.union([], fields);

/*
 * Helper functions
 *
 */

// Do the complete callback with the correct data
var doComplete = function(resultList, total) {
  if (settings.showNextActivity) {
    resultList.forEach(setNextActivity);
  }

  var hidden = [];
  if (settings.object == 'Lead') {
    hidden = ['WhoId','WhatId'];
  } else { 
    var rel = taskRelation ? taskRelation.name : '';
    if (rel) {
      hidden = [rel];
    }
  }
  complete({
    taskRelation: taskRelation ? taskRelation.name : '',
    eventRelation: eventRelation ? eventRelation.name : '',
    hiddenRelations: hidden,
    total: total,
    icon: settings.icon=="number" ? total : settings.icon,
    list: resultList
  });
};

var doPostFiltering = function() {
  return hasActivityFilter();
};

var setNextActivity = function(item) {
  var task = item.Tasks?item.Tasks[0]:undefined;
  var event = item.Events?item.Events[0]:undefined;
  if (task === undefined && event === undefined) {
    // We have no future tasks - don't show nothin'
  } else if (task === undefined ||
             (event !== undefined && (new Date(task.ActivityDate)).getTime() > (new Date(event.ActivityDateTime)).getTime()) ) {
    // Event is next activity    
    item.nextActivity = event;
    item.nextActivity.Type = 'Event';

    // Remove next from the list
    item.Events.shift();
  } else {
    // Task is next activity
    item.nextActivity = task;
    item.nextActivity.Type = 'Task';

    // Remove next from the list
    item.Tasks.shift();
  }
}

// Filter out items based on the activity filter setting
var activityFilterWith = function(item) {
  return (item.Events && item.Events.length) ||
    (item.Tasks && item.Tasks.length) 
};

var activityFilterWithout = function(item) {  
  return !activityFilterWith(item);
};

var getActivityFilter = function() {
  if (settings.activityFilterType) {
    switch (settings.activityFilterType) {
    case 'without':
      return activityFilterWithout;
      break;
    case 'with':
      return activityFilterWith;
      break;
    }
  }
  return null;
};

var hasActivityFilter = function() {
  return getActivityFilter() != null;
};

var doActivityFilter = function(result) {
  var activityFilterFunction = getActivityFilter();
  if (activityFilterFunction) {
    return result.filter(activityFilterFunction);
  } else {
    return result;
  }
}

// Query the activities and append them to the result set
var hasActivityQuery = function () {
  return settings.showNextActivity ||
    settings.showLastActivity ||
    hasActivityFilter();
}

var appendActivity = function(resultSet, activities, relation, relationshipName, isHistory) {
  if (!activities || !activities.length) {
    return;
  }
  activities.forEach(function(activity) {
    var host = resultSet.find(function(host) {
      return host.Id == activity[relation];
    });
    if (host) {
      var target = (isHistory && isHistory(activity)) ? 'ActivityHistories' : relationshipName; 
      if (!host[target]) {
        host[target] = [];
      }
      host[target].push(activity);
    }
  });
}


var getActivityRelations = function() {
  var promises = [];
  promises.push(qDescribe('Task').then(function(taskDescription) {
    taskRelation = taskDescription.fields.find(function(field) {
      return field.type == 'reference' && field.referenceTo.indexOf(settings.object) != -1;
    });
  }));
  promises.push(qDescribe('Event').then(function(eventDescription) {
    eventRelation = eventDescription.fields.find(function(field) {
      return field.type == 'reference' && field.referenceTo.indexOf(settings.object) != -1;
    });
  }));

  return Q.all(promises);
};

var queryActivity = function(result) {

  var queryFuture = settings.showNextActivity || hasActivityFilter();
  var queryHistory = settings.showLastActivity;
  var queries = [];
  if (queryFuture || queryHistory) {
    var ids = result.map(function(obj) {
      return obj.Id;
    });
    if (taskRelation) {
      var taskRelationName = taskRelation.name;
      var taskFilter = settings.taskFilter ? RuntimeHelpers.parseQuery(settings.taskFilter, context) : '';
      if (!queryHistory) {
        // We don't need the closed ones
        if (taskFilter.length) {
          taskFilter += ' AND ';
        }
        taskFilter += "IsClosed=false AND ";
      } else if (taskFilter.length) {
        taskFilter += ' AND ';
      }
      queries.push(
        qQuery("SELECT Subject, ActivityDate, IsClosed, WhoId, Who.Id, Who.Name, WhatId, What.Id, What.Name, Owner.Alias FROM Task WHERE " + taskFilter + 
               taskRelationName + " IN ('" + ids.join("','") + "')" + 
               " ORDER BY ActivityDate ASC")
        .then(function(tasks) {
          appendActivity(result, tasks, taskRelationName, 'Tasks',
                         function(item) {
                           // Filter to determin if the task is a upcoming or completed one
                           return item['IsClosed'];
                         });
        }));
    }

    if (eventRelation) {
      var eventRelationName = eventRelation.name;
      var eventFilter = settings.eventFilter ? RuntimeHelpers.parseQuery(settings.eventFilter, context) : '';
      if (!queryHistory) {
        if (eventFilter.length) {
          eventFilter += " AND ";
        }
        eventFilter += "StartDateTime >= TODAY AND ";
      } else if (eventFilter.length) {
          eventFilter += " AND ";
      }
      queries.push(
        qQuery("SELECT Subject, StartDateTime, Description, WhoId, Who.Id, Who.Name, WhatId, What.Id, What.Name, Owner.Alias FROM Event WHERE " + eventFilter + 
               eventRelationName + " IN ('" + ids.join("','") + "')" + 
               " ORDER BY StartDateTime ASC")
        .then(function(events) {
          var now = (new Date()).getTime();
          appendActivity(result, events, eventRelationName, 'Events',
                         function(item) {
                           // Determine if this belongs to the history nucket or the future 
                           return (new Date(item['StartDateTime'])).getTime() < now;
                         });
        }));
    }
  }

  var strToTs = function(string) {
    var ret;
    try {
      ret = Date.parse(string);
      if (!ret)
        ret = new Date(string);
      if (!ret) {
        ret = 0;
      } else {
        ret = ret.getTime();
      }
    } catch(error) {}
    return ret;
  }

  return Q.all(queries)
  .then(function() {
    result.forEach(function(r) {
      if (r && r.ActivityHistories && r.ActivityHistories.length) {
        r.ActivityHistories.sort(function(a,b) {
          var dateStrA = a.StartDateTime || a.ActivityDate || a.LastModifiedDate;
          var dateStrB = b.StartDateTime || b.ActivityDate || b.LastModifiedDate;
          var tsA = strToTs(dateStrA);
          var tsB = strToTs(dateStrB);
          return tsB - tsA;          
        });
      }
    });
    return result;
  });
}

// Determine if the card shall be rerun
var events = context.events;
if (events) {
  // Check if the card is triggered by a user action
  if (events.indexOf('useraction') != -1) {
    // It is a useraction, only rerun if the action contains the
    // configured object type
    if (!_.some(events, function (e) {
      return (typeof e === 'string') && 
        (e.match(settings.object) || // The object matches
         (hasActivityQuery() && // The filter depends on activity
          (e.match(/task/i) || e.match(/event/i))));
    })) {
      // Some other update, ignore
      complete('nochange');
      return;
    }
  }
}

/* If there is a preprocess function defined, run it now
 */
if (typeof preProcessFunction === 'function') {
  preProcessFunction(fields, filter);
}

// Query for the correct fields from the correct object whith the correct filters.
return Helpers.checkFields(settings.object,Helpers.unique(fields))
.then(function(allFields){
  return Helpers.addMissingFields(settings.object, allFields)
  .then(function(allFields) {
    // Build and run the query
    var filterString = (filter.length) ? " WHERE " + filter.join(" AND ") + " " : "";

    // Verify the orderer
    var hasOrderField = allFields.indexOf(soqlOrderer.split(' ')[0]) != -1;
    if (!hasOrderField) {
      // Fallback to default
      soqlOrderer = settings.orderfield = 'LastModifiedDate';
      if (allFields.indexOf('LastModifiedDate') == -1) {
        // Also add it the the fields
        allFields.push('LastModifiedDate');
      }
    }

    if (soqlOrderer) {
      soqlOrderer = ' ORDER BY ' + soqlOrderer;
    }
    
    return qQuery("SELECT " + allFields.join(',') + " FROM " + settings.object + filterString + soqlOrderer + soqlLimit, "list")
    .then(function(result) {
      if (!result || result.length == 0) {
        // If result is empty we can bail out already here
        complete();
        return;
      }
      var originalQueryLength = result.length;

      // Query tasks and events if needed
      return getActivityRelations()
        .then(function() {
          return Q.fcall(queryActivity, result)
        })
        .then(function(result) {
          return Q.fcall(doActivityFilter, result);
        })
        .then(function(result) {          
          // We now have the complete result set
          // Caclulate the order label
          if (settings.orderfield) {
            result.forEach(function(r) {
                if (r[settings.orderfield]) {
                  var orderByField = settings.orderfield;
                  var sortDate = null;
                  var isDate = false;
                  try {
                    sortDate = new Date(r[orderByField]);
                    if (sortDate == null || Object.prototype.toString.call(sortDate) !== "[object Date]" ||
                        sortDate.getTime() < 10000) {
                      isDate = false;
                    } else {
                      isDate = true;
                    }
                  } catch (err) {}
                  if (isDate && sortDate.getTime() > 10000)
                    r.orderLabel = sortDate.toString("ddd dd MMM yyyy");
                  else
                    r.orderLabel = r[orderByField];
                  
                  r.orderLabel = settings.orderlabel + ' ' + r.orderLabel;
                }
            });
          }

          /* If defined run the post process function */
          if (typeof postProcessFunction === 'function') {
            result = postProcessFunction(result);
          }          

          if (originalQueryLength == limit) {
            if (doPostFiltering()) {
              // We have hit the limit on the original query and then done some filtering on that data
              // not possible to get the "real" max
              doComplete(result, result.length + "+");
            } else {
              // We hit the limit, do a full count!
              return qQuery("SELECT COUNT(Id)cnt FROM " + settings.object + filterString)
                .then(function(cnt) {
                  if (cnt && cnt.length) {
                    doComplete(result, cnt[0].cnt);
                  }
                });
            }
          } else {
            doComplete(result, result.length);
          }
        });
    });
  });
});
