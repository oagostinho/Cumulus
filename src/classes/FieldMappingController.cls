public with sharing class FieldMappingController {

    @AuraEnabled(cacheable=true)
    public static Map<String, List<FieldInfo>> getFieldInfos(String[] objectNames) {
        Map<String, List<FieldInfo>> fieldInfosByObjectName = new Map<String, List<FieldInfo>>();
        for (String objectName : objectNames) {
            if (fieldInfosByObjectName.keySet().contains(objectName)) {
                continue;
            }

            Map<String, Schema.DescribeFieldResult> dfrs =
                    UTIL_Describe.getAllFieldsDescribe(
                            UTIL_Namespace.StrAllNSPrefix(objectName)
                    );

            List<FieldInfo> fieldInfos = new List<FieldInfo>();
            for (DescribeFieldResult dfr : dfrs.values()) {
                fieldInfos.add(new FieldInfo(dfr));
            }
            fieldInfosByObjectName.put(objectName, fieldInfos);
        }
        return fieldInfosByObjectName;
    }

    public class FieldInfo {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String name;
        @AuraEnabled
        public String displayType;

        public FieldInfo(DescribeFieldResult dfr) {
            this.name = dfr.getName();
            this.label = dfr.getLabel();
            this.displayType = dfr.getType().name();
        }
    }
}