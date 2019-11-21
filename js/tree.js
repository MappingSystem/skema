var dom, keys, node, root, element, tree = {

    feed : function(id, size) {

        // Accessing root
        // https://dev.to/carlmungazi/a-journey-through-reactdom-render-302c

        element = document.getElementById('graphiql');
        root = element._reactRootContainer._internalRoot;

        dom = element.getElementsByClassName('execute-button')[1];
        node = this.getReact(); console.log(node);

        draw.getJSON();

    },

    getReact : function() {

        // Accessing react-dom
        // https://stackoverflow.com/a/58968770/4058484
        // https://medium.com/@sitambas/get-global-element-state-a408a744e99d

        let key = Object.keys(dom).find(key=>key.startsWith("__reactInternalInstance$"));
        let internalInstance = dom[key];
        if (internalInstance == null) return null;

        if (internalInstance.return) { // react 16+
            return internalInstance._debugOwner
                ? internalInstance._debugOwner.stateNode
                : internalInstance.return.stateNode;
        } else { // react <16
            return internalInstance._currentElement._owner._instance;
        }

    },

    getKeys : function(data) {

        // Accessing storage data
        // https://stackoverflow.com/a/55310101/4058484

        const getObjectKeys = (obj, prefix = '') => {
            return Object.entries(obj).reduce((collector, [key, val]) => {
                const newKeys = [ ...collector, prefix ? `${prefix}.${key}` : key ]
                if (Object.prototype.toString.call(val) === '[object Object]') {
                    const newPrefix = prefix ? `${prefix}.${key}` : key
                    const otherKeys = getObjectKeys(val, newPrefix)
                    return [ ...newKeys, ...otherKeys ]
                }
                return newKeys
            }, [])
        }

        //return getObjectKeys({a: 1, b: 2, c: { d: 3, e: { f: 4 }}});
        return getObjectKeys(data);

    }

}
