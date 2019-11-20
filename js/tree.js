var tree = {

    feed : function(id, size) {

        // Accessing React Internal Instance
        // https://szhshp.org/tech/2019/08/10/reactindepthrender.html
        // https://dev.to/carlmungazi/a-journey-through-reactdom-render-302c

        var graphiql = document.getElementById('graphiql');
        console.log(tree.getReact(graphiql));

        var root = graphiql._reactRootContainer._internalRoot;
        console.dir(root.current);

        draw.getJSON();

    },

    getReact : function(dom) {

        // Accessing global element state
        // https://stackoverflow.com/a/55310101/4058484
        // https://medium.com/@sitambas/get-global-element-state-a408a744e99d

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

        let key = Object.keys(dom).find(key=>key.startsWith("__react"));
        return getObjectKeys({a: 1, b: 2, c: { d: 3, e: { f: 4 }}});

    }

}


