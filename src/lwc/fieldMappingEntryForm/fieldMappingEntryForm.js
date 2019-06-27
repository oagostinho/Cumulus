import {LightningElement, api, track} from 'lwc';
import getFieldInfos from '@salesforce/apex/FieldMappingController.getFieldInfos';

export default class FieldMappingEntryForm extends LightningElement {

    @track error;

    sourceObjectName = 'DataImport__c';
    @track sourceOptions = [];
    @track selectedSourceFieldName = '';
    displayTypeBySourceFieldNameMap;

    @api targetObjectName; //initialize this public property from parent,
                            //currently uses Account as default if not set
    targetOptions = [];
    @track selectedTargetFieldName = '';
    @track validTargetOptions = [];

    constructor() {
        super();

        getFieldInfos({objectNames:[this.sourceObjectName, this.targetObjectName || 'Account']})
            .then(data => {
                this.sourceOptions = this.getOptions(data[this.sourceObjectName]);
                this.targetOptions = this.getOptions(data[this.targetObjectName || 'Account']);
                this.setDisplayTypeByFieldName();
            })
            .catch(error => {
                this.error = error;
            });
    }

    setDisplayTypeByFieldName() {
        this.displayTypeBySourceFieldNameMap = new Map();
        this.sourceOptions.forEach(sourceFieldOption => {
            this.displayTypeBySourceFieldNameMap.set(
                sourceFieldOption.value, sourceFieldOption.displayType);
        });
    }

    getOptions(data) {
        let x = [];
        data.forEach(item => {
            let option = {
                label: item.label,
                value: item.name,
                displayType: item.displayType
            };
            x.push(option);
        });
        return x;
    }

    handleSourceFieldChange(event) {
        this.selectedTargetFieldName = '';
        this.selectedSourceFieldName = event.detail.value;
        let sourceFieldType =
            this.displayTypeBySourceFieldNameMap.get(this.selectedSourceFieldName);
        this.validTargetOptions =
            this.targetOptions.filter(this.isValidTargetMapping(sourceFieldType));
    }

    handleTargetFieldChange(event) {
        this.selectedTargetFieldName = event.detail.value;
    }

    isValidTargetMapping(sourceType) {
        return targetFieldInfo => {
            return ((targetFieldInfo.displayType === sourceType)
                || (this.validTargetTypesBySourceType
                    .get(sourceType)
                && this.validTargetTypesBySourceType
                .get(sourceType)
                .includes(targetFieldInfo.displayType)));
        }
    }

    validTargetTypesBySourceType = new Map(
        [
            ["ID", ["STRING"]],
            ["REFERENCE", ["STRING"]],
            ["PHONE", ["STRING"]],
            ["TEXTAREA", ["STRING"]],
            ["URL", ["STRING"]],
            ["EMAIL", ["STRING"]],
            // The following currently only support same-type mapping
            // ["BOOLEAN", []],
            // ["STRING", []],
            // ["DATETIME", []],
            // ["DATE", []],
            // ["PICKLIST", []],
            // ["CURRENCY", []],
            // ["PERCENT", []]
        ]
    );

}