describe('EditGroup service', function() {

  'use strict';

  var service,
      db,
      audit,
      doc;

  beforeEach(function() {
    db = {
      getDoc: function(recordId, callback) {
        callback(null, doc);
      }
    };
    audit = {};
    module('inboxApp');
    module(function ($provide) {
      $provide.value('db', db);
      $provide.value('audit', audit);
    });
    inject(function(_EditGroup_) {
      service = _EditGroup_;
    });
  });

  it('returns get errors', function() {
    db.getDoc = function(recordId, callback) {
      callback('db messed up');
    };
    var group = {};
    service('123', group, function(err) {
      chai.expect(err).to.equal('db messed up');
    });
  });

  it('does not save if nothing changed', function() {
    doc = {
      scheduled_tasks: [
        { group: 1 },
        { group: 2 },
        { group: 3 }
      ]
    };
    var group = {
      rows: [ { group: 1, state: 'muted' } ]
    };
    service('123', group, function(err, actual) {
      chai.expect(err).to.equal(null);
      chai.expect(actual).to.deep.equal(doc);
    });
  });

  it('returns save errors', function() {
    doc = {
      scheduled_tasks: [
        { group: 1 },
        { group: 2 },
        { group: 3 }
      ]
    };
    audit.saveDoc = function(record, callback) {
      callback('audit borked');
    };
    var group = {
      rows: [ { group: 1, state: 'scheduled' } ]
    };
    service('123', group, function(err) {
      chai.expect(err).to.equal('audit borked');
    });
  });

  it('saves updated doc', function() {
    doc = {
      scheduled_tasks: [
        { group: 1, due: '1', messages: [ { message: 'a' } ] },
        { group: 2, due: '2', messages: [ { message: 'b' } ] },
        { group: 2, due: '3', messages: [ { message: 'c' } ] },
        { group: 3, due: '4', messages: [ { message: 'd' } ] }
      ]
    };
    audit.saveDoc = function(record, callback) {
      callback();
    };
    var group = {
      rows: [ 
        { group: 2, state: 'scheduled', due: '5', messages: [ { message: 'e' } ] },
        { group: 2, state: 'muted', due: '6', messages: [ { message: 'f' } ] }
      ]
    };
    service('123', group, function(err, actual) {
      chai.expect(err).to.equal(undefined);
      chai.expect(actual.scheduled_tasks.length).to.equal(4);

      chai.expect(actual.scheduled_tasks[0].group).to.equal(1);
      chai.expect(actual.scheduled_tasks[0].due).to.equal('1');
      chai.expect(actual.scheduled_tasks[0].messages.length).to.equal(1);
      chai.expect(actual.scheduled_tasks[0].messages[0].message).to.equal('a');

      chai.expect(actual.scheduled_tasks[1].group).to.equal(2);
      chai.expect(actual.scheduled_tasks[1].due).to.equal('5');
      chai.expect(actual.scheduled_tasks[1].messages.length).to.equal(1);
      chai.expect(actual.scheduled_tasks[1].messages[0].message).to.equal('e');

      chai.expect(actual.scheduled_tasks[2].group).to.equal(2);
      chai.expect(actual.scheduled_tasks[2].due).to.equal('3');
      chai.expect(actual.scheduled_tasks[2].messages.length).to.equal(1);
      chai.expect(actual.scheduled_tasks[2].messages[0].message).to.equal('c');

      chai.expect(actual.scheduled_tasks[3].group).to.equal(3);
      chai.expect(actual.scheduled_tasks[3].due).to.equal('4');
      chai.expect(actual.scheduled_tasks[3].messages.length).to.equal(1);
      chai.expect(actual.scheduled_tasks[3].messages[0].message).to.equal('d');
    });
  });

});