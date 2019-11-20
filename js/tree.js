var tree = {

    feed : function(id, size) {

        // Accessing React Internal Instance
        // https://szhshp.org/tech/2019/08/10/reactindepthrender.html
        // https://dev.to/carlmungazi/a-journey-through-reactdom-render-302c

        var graphiql = document.getElementById('graphiql');

        var root = graphiql._reactRootContainer._internalRoot;
        console.dir(root.current);

        //console.log(tree.getReactElement(graphiql));

        draw.getJSON();

    },

    getReactElement : function(dom)) {

        // Accessing global element state
        // https://medium.com/@sitambas/get-global-element-state-a408a744e99d
        // let key = Object.keys(graphiql).find(key=>key.startsWith("__reactInternalInstance$"));

        for (var key in dom) {
            
            if (key.startsWith(“__reactInternalInstance$”)) 
            {
               var compInternals = dom[key]._currentElement;
               var compWrapper = compInternals._owner;
               var comp = compWrapper._instance;
               return comp;
            }

        }

        return null;

    }

}
