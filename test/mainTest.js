var turnOnDebugLogging = true;

var {
    User,
    Credential
} = require("../index.js");
var Component = require("component-class");
var {
    ComponentManager
} = require("simple-component-manager");

var assert = require("chai").assert;

var dummyComponentManager = {
    registerType: function() {},
    getType: function() {},
    register: function() {},
    get: function(name) {
        if (name === "logger") return dummyLogger;
    },
    clear: function() {},
    config: function() {},
    init: function() {},
    shutdown: function() {},
    componentList: new Map(),
    typeList: new Map()
};

class dummyUdsClass extends Component {}
var dummyUds = new dummyUdsClass(new ComponentManager());

var dummyLogger = {
    create: function() {
        return new Proxy(function() {}, {
            get: function() {
                return function(...msg) {
                    if (turnOnDebugLogging) console.log(...msg);
                };
            },
        });
    }
};

describe("user", function() {
    it("can get updates");
    it("can get complete object");

    describe("getJournal", function() {
        var u;
        beforeEach(function() {
            u = new User(dummyUds);
            u.initialize("username", "adam");
            u.initialize("child1", "julia");
            u.initialize("child2", "nobody");
            u.initialize("beer", true);
            u.initialize("const", true);
            u.set("username", "sara"); // update after init
            u.delete("child1"); // delete after set
            u.delete("child2"); // delete
            u.set("child2", "miles"); // set after delete
            u.set("age", 40); // update without init
            u.delete("beer"); // delete init
        });

        it("get object", function() {
            var ret = u.getJournal({
                type: "object"
            });
            assert.isObject(ret);
        });

        it("get object with updates only", function() {
            var ret = u.getJournal({
                type: "object",
                update: true,
                delete: false,
                init: false
            });

            assert.isObject(ret);
            var expected = {
                username: "sara",
                child2: "miles",
                age: 40
            };
            assert.deepEqual(ret, expected);
        });

        it("get object with deletes only", function() {
            var ret = u.getJournal({
                type: "object",
                update: false,
                delete: true,
                init: false
            });

            assert.isObject(ret);
            var expected = {
                beer: undefined,
                child1: undefined
            };
            assert.deepEqual(ret, expected);
        });

        it("get object with initial values only", function() {

            var ret = u.getJournal({
                type: "object",
                update: false,
                delete: false,
                init: true
            });

            assert.isObject(ret);
            console.log("ret", ret);
            var expected = {
                const: true // never updated
            };
            console.log("expected", expected);
            assert.deepEqual(ret, expected);

        });

        it("get object with updates and deletes only", function() {
            var ret = u.getJournal({
                type: "object",
                update: true,
                delete: true,
                init: false
            });

            assert.isObject(ret);
            var expected = {
                username: "sara",
                child2: "miles",
                age: 40,
                beer: undefined,
                child1: undefined
            };
            assert.deepEqual(ret, expected);
        });

        it("get map");
        it("get array");
    });
});

describe("credential", function() {
    it("can update credential");
    it("can set credential attributes");
});