/**
 * Created by kenneth.lewis on 2019-06-24.
 */

public with sharing class FieldMappingController {

    @AuraEnabled(cacheable=true)
    public static List<FieldInfo> getTargetFieldInfos(
            String sourceObjectName,
            String sourceFieldName,
            String targetObjectName) {
        //Provide the list of fields on the target object that match the data type of the
        // provided field
        String nsAppropriateSourceObjectName = UTIL_Namespace.StrAllNSPrefix(sourceObjectName);
        String nsAppropriateSourceFieldName = UTIL_Namespace.StrAllNSPrefix(sourceFieldName);
        String nsAppropriateTargetObjectName = UTIL_Namespace.StrAllNSPrefix(targetObjectName);

        System.debug(LoggingLevel.ERROR, '*** variable value: ' + nsAppropriateTargetObjectName);
        System.debug(LoggingLevel.ERROR, '^^^^^^ nsAppropriateTargetObjectName ^^^^^^');
        Map<String, Schema.DescribeFieldResult> dfrs =
                UTIL_Describe.getAllFieldsDescribe(nsAppropriateTargetObjectName);

        List<FieldInfo> fieldInfos = new List<FieldInfo>();
        for (DescribeFieldResult describeFieldResult : dfrs.values()) {
            fieldInfos.add(new FieldInfo(describeFieldResult));
        }
        System.debug(LoggingLevel.ERROR, '*** fieldInfos from getTargetFieldInfos value: ' + fieldInfos);
        return fieldInfos;
    }

    @AuraEnabled(cacheable=true)
    public static List<FieldInfo> getSourceFieldInfos(String objectApiName){
        Map<String, Schema.DescribeFieldResult> dfrs =
                UTIL_Describe.getAllFieldsDescribe(objectApiName);

        List<FieldInfo> fieldInfos = new List<FieldInfo>();
        for (DescribeFieldResult describeFieldResult : dfrs.values()) {
            fieldInfos.add(new FieldInfo(describeFieldResult));
        }
        System.debug(LoggingLevel.ERROR, '*** variable value: ' + fieldInfos);
        return fieldInfos;
    }

    public class FieldInfo {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String name;
        @AuraEnabled
        public DisplayType type;

        public FieldInfo(DescribeFieldResult dfr) {
            this.name = dfr.getName();
            this.label = dfr.getLabel();
            this.type = dfr.getType();
        }
    }
}