/**
 * Created by kenneth.lewis on 2019-06-24.
 */

import {LightningElement, track, wire} from 'lwc';
import getSourceFieldInfos from '@salesforce/apex/FieldMappingController.getSourceFieldInfos';

export default class FieldMappingEntryForm extends LightningElement {
    @track sourceFieldName = '';
    @track sourceFieldOptions = getSourceFieldInfos({objectApiName:'DataImport__c'});

    @track value = 'Select a source field';
    @track options = [];

    // @wire(getSourceFieldInfos({ objectApiName:'DataImport__c' })) options;

    constructor(){
        super();
        getSourceFieldInfos({objectApiName: 'DataImport__c'})
            .then((data) => {
                let x = [];
                data.forEach((item) => {
                    let option = {
                        label: item.label,
                        value: item.name
                    };
                    console.log('*** ' + 'option!' + ' ***');
                    console.log(JSON.stringify(option));
                    x.push(option);
                });
                console.log('*** ' + 'setting options' + ' ***');
                this.options = x;
            });
    }
    // get options() {
    //     let options = [];
    //     getSourceFieldInfos({ objectApiName:'DataImport__c' })
    //         .then((data) => {
    //
    //             // return [{label:'test',value:'test'}];
    //
    //             for (let i = 0; i < 10; i++) {
    //                 let datum = data[i];
    //                 let option = {
    //                     label: datum.label,
    //                     value: datum.name
    //                 };
    //                 console.log('*** ' + 'option!' + ' ***');
    //                 console.log(JSON.stringify(option));
    //                 options.push(option);
    //             }
    //             console.log('*** ' + 'returning after for loop' + ' ***');
    //             // return options;
    //             //
    //             // data.forEach((item) => {
    //             //     let option = {
    //             //         label: item.label,
    //             //         value: item.name
    //             //     };
    //             //     console.log('*** ' + 'option!' + ' ***');
    //             // console.log(JSON.stringify(option));
    //             //     options.push(option);
    //             // });
    //             // console.log('*** ' + 'options:' + ' ***');
    //             // console.log(JSON.stringify(options));
    //             //
    //             // // debugger;
    //             // return options;
    //             // let options = this.addMapsToIconProperty(data);
    //             // console.log('received data: ', data);
    //             // console.log('fieldMappings: ', this.fieldMappings);
    //     console.log('*** ' + 'options' + ' ***');
    //             console.log(JSON.stringify(options));
    //     return options;
    //         })
    //         .catch((error) => {
    //             this.message = 'Error received: code' + error.errorCode + ', ' +
    //                 'message ' + error.body.message;
    //             console.log(this.message);
    //         });
    //
    //
    //     // options [] = getSourceFieldInfos({objectApiName:'DataImport__c'});
    //     //
    //     // return [
    //     //     { label: 'New', value: 'new' },
    //     //     { label: 'In Progress', value: 'inProgress' },
    //     //     { label: 'Finished', value: 'finished' },
    //     // ];
    // }

    handleChange(event) {
        this.value = event.detail.value;
    }


    @track value2 = 'inProgress2';

    get options2() {
        return [
            { label: 'New2', value: 'new2' },
            { label: 'In Progress2', value: 'inProgress2' },
            { label: 'Finished2', value: 'finished2' },
        ];
    }

    handleChange2(event) {
        this.value2 = event.detail.value;
    }
}