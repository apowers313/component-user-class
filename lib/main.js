var Component = require("component-class");

class Op {
    constructor(op, fieldName, value) {
        if (typeof op !== "string") {
            throw new TypeError("exepected 'op' to be string, got " + typeof op);
        }

        if (typeof fieldName !== "string") {
            throw new TypeError("exepected 'fieldName' to be string, got " + typeof fieldName);
        }

        this.op = op;
        this.fieldName = fieldName;
        this.value = value;
    }
}

class Table {
    constructor(uds) {
        if (!(uds instanceof Component)) {
            throw new TypeError("expected UDS component");
        }

        this.uds = uds;
        this.journal = [];
    }

    createSchema(schema) {
        this.schema = schema;
    }

    get(fieldName) {
        if (typeof fieldName !== "string") {
            throw new TypeError("exepected 'fieldName' to be string, got " + typeof fieldName);
        }

        // find the last instance 'op' on 'fieldName'
        var obj;
        for (let i = (this.journal.length - 1); i >= 0; i--) {
            obj = this.journal[i];
            if (obj.fieldName === fieldName) break;
        }

        return obj.value;
    }

    set(fieldName, value) {
        var newOp = new Op("set", fieldName, value);
        this.journal.push(newOp);
    }

    initialize(fieldName, value) {
        var newOp = new Op("init", fieldName, value);
        this.journal.push(newOp);
    }

    delete(fieldName, value) {
        var newOp = new Op("delete", fieldName, value);
        this.journal.push(newOp);
    }

    /**
     * Returns the journal in the format requested by `opts`
     * @param  {Object}  [opts]                 The options for the journal that is returned
     * @param  {Type}    [opts.type="object"]   The format to return. Options are "map", "object", or "array".
     * @param  {Boolean} [opts.last=true]       Include only the last recorded operation. Only applies if type is "array".
     * @param  {Boolean} [opts.update=true]     Include updates in the journal
     * @param  {Boolean} [opts.delete=true]     Include deletes in the journal
     * @param  {Boolean} [opts.init=true]       Include initial values in the journal
     * @param  {Boolean} [opts.getTables=false] Only get `Table` types in the results; does not include any `Tables` if not set.
     * @return {Map|Object|Array}               As specified by the `opts.type` parameter
     */
    getJournal(opts) {
        opts = opts || {};
        var type = opts.type || "object";
        var last = (opts.last !== undefined) ? opts.last : true;
        var update = (opts.update !== undefined) ? opts.update : true;
        var del = (opts.delete !== undefined) ? opts.delete : true;
        var init = (opts.init !== undefined) ? opts.init : true;
        var tables = (opts.getTables !== undefined) ? opts.getTables : false;

        if (!last && opts.type !== "array") {
            throw new TypeError("the `last` option may only be `false` if the `type` is \"array\"");
        }

        var journal;
        if (last) journal = compressJournal(this.journal);
        journal = journal
            .filter((op) => {
                // console.log ("op", op);
                if (del && op.op === "delete") return true;
                if (update && op.op === "set") return true;
                if (init && op.op === "init") return true;
            });
        // .filter((op) => {
        //     if (tables && op.value instanceof Table) return true;
        //     else if (!tables && !(op.value instanceof Table)) return true;
        //     return false;
        // });
        // console.log ("filtered journal", journal);

        if (type === "object") return createJournalObject(journal);
        else if (type === "map") return createJournalMap(journal);
        else if (type === "array") return createJournalArray(journal);
        throw new Error("unknown type: " + type);

        function compressJournal(journal) {
            // console.log("journal", journal);
            var ret = [];
            var alreadyFound = new Set();
            for (let i = journal.length - 1; i >= 0; i--) {
                let key = journal[i].fieldName;

                if (alreadyFound.has(key)) continue;

                alreadyFound.add(key);
                ret.unshift(journal[i]);
            }

            // console.log("compressed journal", ret);
            return ret;
        }

        function createJournalObject(journal) {
            var ret = {};
            journal.forEach((entry) => {
                let key = entry.fieldName,
                    value = entry.value;
                ret[key] = value;
            });

            return ret;
        }

        function createJournalMap() {
            throw new Error("not implemented");
        }

        function createJournalArray() {
            throw new Error("not implemented");
        }
    }

    commit() {
        // virtual interface to be implemented by child classes
        throw new Error("not implemented!");
    }
}

class User extends Table {
    constructor(uds) {
        super(uds);

        this.createSchema(); // TODO
    }

    /**
     * Creates a new credential associated with the user.
     * @return {Credential} The new Credential object that was created.
     */
    createCredential() {
        var cred = this.uds.createCredential();

        // add the new credential to the list
        var username = this.get("username");
        cred.set("username", username);

        return cred;
    }

    /**
     * Gets all credentials associated with the user.
     * @return {Credential[]} An array of Credential objects associated with the user
     * or an empty Array if no credentials exist.
     */
    getCredentials() {
        var selector = {
            username: this.get("username")
        };
        return this.uds.findCredentials(selector);
    }

    commit() {
        return this.uds.saveUser(this);
    }

    destroy() {
        return this.uds.deleteUser(this);
    }
}

class Credential extends Table {
    constructor(uds) {
        super(uds);
    }

    commit() {
        return this.uds.saveCredential(this);
    }

    destroy() {
        return this.uds.deleteCredential(this);
    }
}

module.exports = {
    Op: Op,
    Table: Table,
    User: User,
    Credential: Credential
};
