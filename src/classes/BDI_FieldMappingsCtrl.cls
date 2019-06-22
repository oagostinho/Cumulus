public with sharing class BDI_FieldMappingsCtrl {

    @AuraEnabled(cacheable=true)
    public static List<Data_Import_Field_Mapping__mdt> getFieldMappings() {
        System.debug('getFieldMappings()');
        List<Data_Import_Field_Mapping__mdt> fieldMappings =
            [SELECT Id, DeveloperName, Label FROM Data_Import_Field_Mapping__mdt LIMIT 10];
        System.debug(fieldMappings);

        return fieldMappings;
    }

    @AuraEnabled(cacheable=true)
    public static List<Data_Import_Field_Mapping__mdt> getFieldMappingsByObjectMappingName(String name) {
        System.debug('getFieldMappingsByObjectMappingName()');
        List<Data_Import_Field_Mapping__mdt> fieldMappings =
            [SELECT Id,
                DeveloperName,
                Label,
                MasterLabel,
                Source_Field_API_Name__c,
                Target_Field_API_Name__c
            FROM Data_Import_Field_Mapping__mdt
            WHERE Target_Object_Mapping__r.DeveloperName = :name];
        System.debug(fieldMappings);

        return fieldMappings;
    }

    @AuraEnabled
    public static Data_Import_Object_Mapping__mdt fetchObjectMapping(String name) {
        System.debug('fetchObjectMapping()');
        List<Data_Import_Object_Mapping__mdt> objectMappings =
            [SELECT Id,
                DeveloperName,
                Label,
                MasterLabel
            FROM Data_Import_Object_Mapping__mdt
            WHERE DeveloperName = :name];
        System.debug(objectMappings);

        return objectMappings[0];
    }
}
