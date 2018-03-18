var turnOnDebugLogging = true;

var {
    User,
    Credential
} = require("../index.js");
var Component = require("component-class");
var assert = require("chai").assert;
var sinon = require("sinon");

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

class DummyUdsClass extends Component {
    saveUser() {
        return Promise.resolve();
    }

    deleteUser() {
        return Promise.resolve();
    }

    findCredentials() {
        return Promise.resolve();
    }

    saveCredential() {
        return Promise.resolve();
    }

    destroyCredential() {
        return Promise.resolve();
    }
}

var dummyUds = new DummyUdsClass(dummyComponentManager);

var dummyLogger = {
    create: function() {
        return new Proxy(function() {}, {
            get: function() {
                return function(...msg) {
                    if (turnOnDebugLogging) console.log(...msg);
                };
            }
        });
    }
};

describe("user", function() {
    it("can be updated");
    it("can be initialized");
    it("can get updates");
    it("can get complete object");
    it("can be committed");
    it("can be destroyed");
    it("can create credential with associated user");
    it("can find all credentials with associated user");

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
            var expected = {
                const: true // never updated
            };
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
    var saveUserSpy;
    var deleteUserSpy;
    var findCredentialsSpy;
    var saveCredentialSpy;
    var destroyCredentialSpy;

    beforeEach(function() {
        saveUserSpy = sinon.spy(dummyUds, "saveUser");
        deleteUserSpy = sinon.spy(dummyUds, "deleteUser");
        findCredentialsSpy = sinon.spy(dummyUds, "findCredentials");
        saveCredentialSpy = sinon.spy(dummyUds, "saveCredential");
        destroyCredentialSpy = sinon.spy(dummyUds, "destroyCredential");
    });

    afterEach(function() {
        dummyUds.saveUser.restore();
        dummyUds.deleteUser.restore();
        dummyUds.findCredentials.restore();
        dummyUds.saveCredential.restore();
        dummyUds.destroyCredential.restore();
    });

    it("can be created", function() {
        var c = new Credential(dummyUds);
        assert.instanceOf(c, Credential);
    });

    it("can update credential");
    it("can set credential attributes");
    it("can be updated");

    it("can be committed", function() {
        var c = new Credential(dummyUds);
        var p = c.commit();
        assert.instanceOf(p, Promise);
        assert.strictEqual(saveCredentialSpy.callCount, 1);
    });

    it("can be destroyed", function() {
        var c = new Credential(dummyUds);
        var p = c.destroy();
        assert.instanceOf(p, Promise);
        assert.strictEqual(destroyCredentialSpy.callCount, 1);
    });
});