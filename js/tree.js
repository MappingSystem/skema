var tree = {

    feed : function(id, size) {

        //https://szhshp.org/tech/2019/08/10/reactindepthrender.html
        console.dir(document.getElementById('graphiql')._reactRootContainer._internalRoot);
        draw.getJSON();

    },

    getReact : function(dom) {

        // Accessing global element state
        // https://medium.com/@sitambas/get-global-element-state-a408a744e99d
        // let key = Object.keys(graphiql).find(key=>key.startsWith("__reactInternalInstance$"));


        return null;

    }

}
