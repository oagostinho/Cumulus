
import getSourceFieldInfos from '@salesforce/apex/FieldMappingController.getSourceFieldInfos';
import getTargetFieldInfos from '@salesforce/apex/FieldMappingController.getTargetFieldInfos';

const getTargetFieldOptions = (sourceObjName = 'DataImport__c',
                               sourceFieldName,
                               targetObjName) => {
    let options = [];

    getTargetFieldInfos({
        sourceObjName: sourceObjName,
        sourceFieldName: sourceFieldName,
        targetObjName: targetObjName
    })
        .then((data) => {
            console.log('*** ' + 'data!' + ' ***');
            console.log(data);
            debugger;
        })
        .catch(() => {
            console.log('*** ' + 'in catch' + ' ***');
        });

    return options;
}

const getRelationshipFieldOptions = (objName) => {
    let options = [];

    return options;
}

const cleanObjectName = (objName) => {
    let nsAppropriateObjName = getNamespaceAppropriateObjName(objName);
    return nsAppropriateObjName;
}

export {getTargetFieldOptions, getRelationshipFieldOptions}