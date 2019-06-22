({
    handleGetObjectMapping : function(args, inputValue) {
        console.log('harness | helper | handleGetObjectMapping()');
        let [component, event, helper] = args;
        let action = component.get('c.fetchObjectMapping');
        action.setParams({ name: inputValue });
        action.setCallback(this, function(response) {
            let state = response.getState();
            let data = response.getReturnValue();
            console.log('harness | helper | APEX fetchObjectMapping() STATE: ' + state);
            if (state === 'SUCCESS') {
                console.log('DATA: ', data);
                component.set('v.objectMapping', data);
                component.set('v.isDoneLoading', true);

                // Force LWC to pull Field Mappings
                component.find('bdiFieldMappings').forceRefresh();
            } else {
                console.log('BAD OBJECT MAPPING NAME');
                alert('Bad object mapping name');
            }
        });
        $A.enqueueAction(action);
    }
})
