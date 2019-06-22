({
    init : function(component, event, helper) {
        console.log('harness | controller | init()');
        helper.handleGetObjectMapping(arguments, 'Account1');
    },

    keyCheck : function(component, event, helper) {
        console.log('harness | controller | keyCheck()');
        if (event.which == 13) {
            let inputValue = event.currentTarget.value;
            helper.handleGetObjectMapping(arguments, inputValue);
        }
    }
})
