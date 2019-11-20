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
        // https://medium.com/@sitambas/get-global-element-state-a408a744e99d
        //let key = Object.keys(dom).find(key=>key.startsWith("__reactInternalInstance$"));

        //var reactDevToolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__._fiberRoots;
        //var instArray = [...reactDevToolsHook[Object.keys(reactDevToolsHook)[0]]];
        return dom[key];

    }

}
