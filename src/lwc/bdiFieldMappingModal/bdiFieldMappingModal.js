import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsubNoPageRef';
import createDataImportFieldMapping
    from '@salesforce/apex/BDI_ManageAdvancedMappingCtrl.createDataImportFieldMapping';

// Import custom labels
import bdiBtnClose from '@salesforce/label/c.bdiBtnClose';
import bdiFieldMappings from '@salesforce/label/c.bdiFieldMappings';
import bdiFMUIDatatableMapsTo from '@salesforce/label/c.bdiFMUIDatatableMapsTo';
import bdiFMUIDataType from '@salesforce/label/c.bdiFMUIDataType';
import bdiFMUIFieldLabel from '@salesforce/label/c.bdiFMUIFieldLabel';
import bdiFMUISearchSourceInputLabel from '@salesforce/label/c.bdiFMUISearchSourceInputLabel';
import bdiFMUISearchTargetInputLabel from '@salesforce/label/c.bdiFMUISearchTargetInputLabel';
import bdiFMUISourceObject from '@salesforce/label/c.bdiFMUISourceObject';
import bdiFMUITarget from '@salesforce/label/c.bdiFMUITarget';
import labelMessageLoading from '@salesforce/label/c.labelMessageLoading';
import stgBtnCancel from '@salesforce/label/c.stgBtnCancel';
import stgBtnEdit from '@salesforce/label/c.stgBtnEdit';
import stgBtnNew from '@salesforce/label/c.stgBtnNew';
import stgBtnSave from '@salesforce/label/c.stgBtnSave';
import stgLabelObject from '@salesforce/label/c.stgLabelObject';
import stgUnknownError from '@salesforce/label/c.stgUnknownError';

export default class bdiFieldMappingModal extends LightningElement {

    customLabels = {
        bdiBtnClose,
        bdiFieldMappings,
        bdiFMUIDatatableMapsTo,
        bdiFMUIDataType,
        bdiFMUIFieldLabel,
        bdiFMUISearchSourceInputLabel,
        bdiFMUISearchTargetInputLabel,
        bdiFMUISourceObject,
        bdiFMUITarget,
        labelMessageLoading,
        stgBtnCancel,
        stgBtnEdit,
        stgBtnNew,
        stgBtnSave,
        stgLabelObject,
    };

    @api objectMapping;
    @api fieldMappingSetName;
    @api isModalOpen = false;
    @api modalMode = 'new';
    @api diFieldDescribes;
    @api targetObjectFieldDescribes;

    @track isLoading;
    @track row;

    @track selectedSourceFieldLabel;
    @track selectedSourceFieldAPIName;
    @track sourceFieldLabelOptions;
    @track selectedSourceFieldDisplayType;
    @track selectedSourceFieldDisplayTypeLabel;
    @track hasSourceFieldErrors;

    @track selectedTargetFieldLabel;
    @track selectedTargetFieldAPIName;
    @track targetFieldLabelOptions;
    @track selectedTargetFieldDisplayType;
    @track selectedTargetFieldDisplayTypeLabel;
    @track hasTargetFieldErrors;

    @api diFieldsByAPIName;
    @api targetFieldsByAPIName;

    @api targetFieldsByLabelByDisplayType;

    @track mappedDIFieldLabels = [];
    @track mappedTargetFieldLabels = [];

    // Map of Display Types
    validTargetTypesBySourceType = {
        'Address': ['Address'],
        'Base64': ['Base64'],
        'Boolean': ['Boolean'],
        'Combobox': ['Combobox'],
        'Currency': ['Currency'],
        'Datacategorygroupreference': ['Datacategorygroupreference'],
        'Date': ['Date'],
        'Datetime': ['Datetime'],
        'Double': ['Double'], // Todo: Sometimes include Integer as per the Bdi Mapping Field Types doc
        'Email': ['Email', 'String'],
        'Encryptedstring': ['Encryptedstring'],
        'Id': ['Id', 'String'],
        'Integer': ['Integer', 'Double'],
        'Long': ['Long'],
        'Multipicklist': ['Multipicklist'],
        'Percent': ['Percent'],
        'Phone': ['Phone', 'String'],
        'Picklist': ['Picklist'], // Todo: Sometimes include Boolean as per the Bdi Mapping Field Types doc
        'Reference': ['Reference', 'String'],
        'String': ['String', 'Picklist'],
        'Textarea': ['Textarea', 'String'],
        'Time': ['Time'],
        'Url': ['Url', 'String']
    };

    // Map of Labels by Display Type
    labelsByDisplayType = {
        'Address': 'Address',
        'Base64': 'Base64',
        'Boolean': 'Checkbox',
        'Combobox': 'Picklist',
        'Currency': 'Currency',
        'Datacategorygroupreference': 'DataCategoryGroupReference',
        'Date': 'Date',
        'Datetime': 'Date/Time',
        'Double': 'Number',
        'Email': 'Email',
        'Encryptedstring': 'Text (Encrypted)',
        'Id': 'Id',
        'Integer': 'Number',
        'Long': 'Text Area (Long)',
        'Multipicklist': 'Picklist (Multi-Select)',
        'Percent': 'Percent',
        'Phone': 'Phone',
        'Picklist': 'Picklist',
        'Reference': 'Lookup Relationship',
        'String': 'Text',
        'Textarea': 'Text Area',
        'Time': 'Time',
        'Url': 'URL'
    };

    get isTargetFieldDisabled() {
        if ((this.selectedSourceFieldAPIName || this.selectedSourceFieldLabel) &&
            (this.targetFieldLabelOptions && this.targetFieldLabelOptions.length > 0)) {
            return false;
        }
        return true;
    }

    get isModalModeNew() {
        return this.modalMode === 'new';
    }

    get sectionClasses() {
        return this.isModalOpen ? 'slds-modal slds-fade-in-open' : 'slds-modal slds-hidden';
    }

    get backdropClasses() {
        return this.isModalOpen ? 'slds-backdrop slds-backdrop_open' : 'slds-backdrop';
    }

    constructor() {
        super();
        this.escapeFunction = this.escapeFunction.bind(this);
    }

    connectedCallback() {
        document.addEventListener("keydown", this.escapeFunction, false);
        registerListener('openModal', this.handleOpenModal, this);
        registerListener('closeModal', this.handleCloseModal, this);

        // Register listeners for child searchable combobox components
        registerListener('sourceFieldLabelChange', this.handleSourceFieldLabelChange, this);
        registerListener('targetFieldLabelChange', this.handleTargetFieldLabelChange, this);
    }

    disconnectedCallback() {
        document.removeEventListener("keydown", this.escapeFunction, false);
        unregisterAllListeners(this);
    }

    /*******************************************************************************
    * @description Handles the open modal event from bdiFieldMappings and allows
    * for SLDS classes to fade in modal elements and backdrop
    *
    * @param event: Event containing row details or lack of row details
    */
    handleOpenModal(event) {
        this.isModalOpen = true;
        this.isLoading = true;
        let that = this;
        let data = event;

        setTimeout(function() {
            that.handleLoadModalData(data);
        }, 1, [that, data]);
    }

    /*******************************************************************************
    * @description Handles loading relevant data into the modal
    *
    * @param event: Event containing row details or lack of row details
    */
    handleLoadModalData(event) {
        try {
            this.hasSourceFieldErrors = false;
            this.hasTargetFieldErrors = false;
            this.objectMapping = event.objectMapping;

            this.collectMappedDataImportFields(event.fieldMappings);

            this.row = event.row;

            if (this.row) {
                // Edit row
                this.modalMode = 'edit';
                this.selectedSourceFieldLabel =
                    this.row.xxPrefixTokenxx_Source_Field_Label_xxSuffixTokenxx;
                this.selectedSourceFieldAPIName =
                    this.row.xxPrefixTokenxx_Source_Field_API_Name_xxSuffixTokenxx;
                this.selectedTargetFieldAPIName =
                    this.row.xxPrefixTokenxx_Target_Field_API_Name_xxSuffixTokenxx;
                this.selectedTargetFieldLabel =
                    this.row.xxPrefixTokenxx_Target_Field_Label_xxSuffixTokenxx;
                this.selectedSourceFieldDisplayType =
                    this.toTitleCase(this.row.xxPrefixTokenxx_Source_Field_Data_Type_xxSuffixTokenxx);
                this.selectedTargetFieldDisplayType =
                    this.toTitleCase(this.row.xxPrefixTokenxx_Target_Field_Data_Type_xxSuffixTokenxx);
                this.selectedSourceFieldDisplayTypeLabel =
                    this.row.Source_Field_Display_Type_Label;
                this.selectedTargetFieldDisplayTypeLabel =
                    this.row.Target_Field_Display_Type_Label;
            } else {
                // New row
                this.modalMode = 'new';
                this.clearSelections();
            }

            this.setDataImportFieldDescribes(this.diFieldDescribes);
            this.setTargetObjectFieldDescribes(this.targetObjectFieldDescribes);
        } catch(error) {
            this.handleError(error);
        }

        this.isLoading = false
    }

    /*******************************************************************************
    * @description Loops through and collects the source field label and target field
    * labels of existing field mappings for the currently selected object mapping
    *
    * @param {array} fieldMappings: List of field mappings from bdiFieldMappings
    */
    collectMappedDataImportFields(fieldMappings) {
        for (let i = 0; i < fieldMappings.length; i++) {
            let fieldMapping = fieldMappings[i];

            this.mappedDIFieldLabels.push(fieldMapping.xxPrefixTokenxx_Source_Field_Label_xxSuffixTokenxx);
            this.mappedTargetFieldLabels.push(fieldMapping.xxPrefixTokenxx_Target_Field_Label_xxSuffixTokenxx);
        }
    }

    /*******************************************************************************
    * @description Creates a map of data import field labels by field API name and a
    * map of data import field API names by field label.
    *
    * @param {FieldInfo[]} fieldInfos: List of BDI_ManageAdvancedMappingCtrl.FieldInfos
    * from the Data Import object
    */
    setDataImportFieldDescribes(fieldInfos) {
        try {
            this.sourceFieldLabelOptions = [];
            let diFieldsByAPIName = {};

            for (let i = 0; i < fieldInfos.length; i++) {

                // Include the data import field if it hasn't already been mapped
                // or if it's the currently selected field (i.e. editing)
                if (!this.mappedDIFieldLabels.includes(fieldInfos[i].label) ||
                    this.selectedSourceFieldLabel === fieldInfos[i].label) {
                    let labelOption = {
                        label: `${fieldInfos[i].label} (${fieldInfos[i].value})`,
                        value: fieldInfos[i].value,
                        displayTypeLabel: fieldInfos[i].displayTypeLabel
                    }

                    this.sourceFieldLabelOptions.push(labelOption);
                    diFieldsByAPIName[labelOption.value] = this.parse(fieldInfos[i]);
                }
            }
            this.sourceFieldLabelOptions = this.sortBy(this.sourceFieldLabelOptions, 'label');
            this.diFieldsByAPIName = diFieldsByAPIName;
        } catch(error) {
            this.handleError(error);
        }
    }

    /*******************************************************************************
    * @description Creates a map of target object field labels by field API name and a
    * map of target object field API names by field label.
    *
    * @param {FieldInfo[]} fieldInfos: List of BDI_ManageAdvancedMappingCtrl.FieldInfos
    * from the Data Import object
    */
    setTargetObjectFieldDescribes(fieldInfos) {
        try {
            this.targetFieldLabelOptions = [];
            let targetFieldsByAPIName = {};
            let targetFieldsByLabelByDisplayType = {};

            for (let i = 0; i < fieldInfos.length; i++) {

                // Include the data import field if it hasn't already been mapped
                // or if it's the currently selected field (i.e. editing)
                if (!this.mappedTargetFieldLabels.includes(fieldInfos[i].label) ||
                    this.selectedTargetFieldLabel === fieldInfos[i].label) {
                    let labelOption = {
                        label: `${fieldInfos[i].label} (${fieldInfos[i].value})`,
                        value: fieldInfos[i].value
                    }

                    this.targetFieldLabelOptions.push(labelOption);
                    targetFieldsByAPIName[labelOption.value] = this.parse(fieldInfos[i]);

                    let displayType = this.toTitleCase(fieldInfos[i].displayType);
                    // Collect target fields by display type
                    if (targetFieldsByLabelByDisplayType[displayType]) {
                        targetFieldsByLabelByDisplayType[displayType].push(labelOption);
                    } else {
                        targetFieldsByLabelByDisplayType[displayType] = [labelOption];
                    }
                }
            }

            this.targetFieldsByAPIName = targetFieldsByAPIName;
            this.targetFieldsByLabelByDisplayType = targetFieldsByLabelByDisplayType;

            if (this.selectedSourceFieldDisplayType) {
                this.handleAvailableTargetFieldsBySourceFieldDisplayType(this.selectedSourceFieldDisplayType);
            }
        } catch(error) {
            this.handleError(error);
        }
    }

    /*******************************************************************************
    * @description Clears out all the various "selected" properties
    */
    clearSelections() {
        this.selectedSourceFieldLabel = undefined;
        this.selectedSourceFieldAPIName = undefined;
        this.selectedSourceFieldDisplayType = undefined;
        this.selectedSourceFieldDisplayTypeLabel = undefined;
        this.selectedTargetFieldLabel = undefined;
        this.selectedTargetFieldAPIName = undefined;
        this.selectedTargetFieldDisplayType = undefined;
        this.selectedTargetFieldDisplayTypeLabel = undefined;
    }

    /*******************************************************************************
    * @description Handles the close modal event from bdiFieldMappings
    */
    handleCloseModal() {
        this.isModalOpen = false;
    }

    /*******************************************************************************
    * @description Handles escape key press and closes the modal
    */
    escapeFunction(event) {
        if (event.keyCode === 27) {
            this.handleCloseModal();
        }
    }

    /*******************************************************************************
    * @description Handles the creation or update of a row based on the existence of
    * the row property. If the row property exists, we only set the source and target
    * field API name, otherwise we set all the fields. Calls the handleDeploymentId
    * function on receiving an id back from createDataImportFieldMapping.
    */
    handleSave() {
        try {
            let missingField = this.handleFieldValidations();
            if (missingField.length === 0) {
                let rowDetails;

                if (this.row) {
                    // Set source and target fields
                    this.row.xxPrefixTokenxx_Source_Field_API_Name_xxSuffixTokenxx =
                        this.selectedSourceFieldAPIName;
                    this.row.xxPrefixTokenxx_Target_Field_API_Name_xxSuffixTokenxx =
                        this.selectedTargetFieldAPIName;
                    rowDetails = JSON.stringify(this.row);
                } else {
                    // New Field Mapping
                    rowDetails = JSON.stringify({
                        DeveloperName: null,
                        Label: this.selectedSourceFieldLabel,
                        MasterLabel: this.selectedSourceFieldLabel,
                        xxPrefixTokenxx_Data_Import_Field_Mapping_Set_xxSuffixTokenxx: this.fieldMappingSetName,
                        xxPrefixTokenxx_Is_Deleted_xxSuffixTokenxx: false,
                        xxPrefixTokenxx_Required_xxSuffixTokenxx: 'No',
                        xxPrefixTokenxx_Source_Field_API_Name_xxSuffixTokenxx: this.selectedSourceFieldAPIName,
                        xxPrefixTokenxx_Target_Field_API_Name_xxSuffixTokenxx: this.selectedTargetFieldAPIName,
                        xxPrefixTokenxx_Target_Object_Mapping_xxSuffixTokenxx: this.objectMapping.DeveloperName
                    });
                }

                this.isLoading = true;
                createDataImportFieldMapping({fieldMappingString: rowDetails})
                    .then((deploymentId) => {
                        this.handleDeploymentId(deploymentId);
                    })
                    .catch((error) => {
                        this.isLoading = false;
                        this.handleError(error);
                    });
            } else {
                this.showToast(
                    'Error',
                    `Missing the following field ${missingField}`,
                    'error',
                    'dismissable');
            }
        } catch(error) {
            this.handleError(error);
        }
    }

    /*******************************************************************************
    * @description Adds error classes to comboboxes and returns a string indicating
    * which combobox selection is incomplete.
    *
    * @return {string} missingFields: Name of the incomplete combobox
    */
    handleFieldValidations() {
        let missingField = '';
        this.hasSourceFieldErrors = false;
        this.hasTargetFieldErrors = false;

        if (!this.selectedSourceFieldAPIName) {
            missingField = 'Source Field';
            this.hasSourceFieldErrors = true;
        }
        if ((!this.selectedTargetFieldAPIName && !this.isTargetFieldDisabled) ||
            (!this.selectedTargetFieldAPIName && this.isTargetFieldDisabled && this.selectedSourceFieldAPIName)) {

            missingField = 'Target Field';
            this.hasTargetFieldErrors = true;
        }

        return missingField;
    }

    /*******************************************************************************
    * @description Creates and dispatches a CustomEvent 'deployment' letting the
    * platformEventListener know that we have an id to register and monitor. After
    * dispatching the CustomEvent, start the deployment timeout on bdiFieldMappings.
    *
    * @param {string} deploymentId: Custom Metadata Deployment Id
    */
    handleDeploymentId(deploymentId) {
        const deploymentEvent = new CustomEvent('deployment', {
            bubbles: true,
            composed: true,
            detail: {deploymentId}
        });
        this.dispatchEvent(deploymentEvent);

        fireEvent(this.pageRef, 'startDeploymentTimeout', { deploymentId: deploymentId });
    }

    /*******************************************************************************
    * @description Handles the onchange event for the bdiFieldMappingModalComboboxSearch
    * sourceFieldLabel, sets the value for both sourceFieldLabel and sourceFieldAPIName,
    * and updates the available target fields based on the selected source field's display
    * type.
    *
    * @param {object} event: Event containing combobox selection details
    */
    handleSourceFieldLabelChange(event) {
        if (event) {
            let fieldAPIName = event.detail.value;
            let fieldInfo = this.diFieldsByAPIName[fieldAPIName];

            this.selectedSourceFieldLabel = fieldInfo.label;
            this.selectedSourceFieldAPIName = fieldAPIName;
            this.selectedSourceFieldDisplayType = this.toTitleCase(fieldInfo.displayType);
            this.selectedSourceFieldDisplayTypeLabel =
                this.labelsByDisplayType[this.selectedSourceFieldDisplayType];
            this.selectedTargetFieldAPIName = undefined;
            this.hasSourceFieldErrors = false;
        } else {
            this.selectedSourceFieldAPIName = undefined;
            this.selectedSourceFieldLabel = undefined;
            this.selectedTargetFieldAPIName = undefined;
            this.selectedSourceFieldDisplayType = undefined;
        }

        this.handleAvailableTargetFieldsBySourceFieldDisplayType(this.selectedSourceFieldDisplayType);
    }

    /*******************************************************************************
    * @description Filters the available target fields based on display type
    *
    * @param {string} displayType: Display Type of the currently selected source field
    */
    handleAvailableTargetFieldsBySourceFieldDisplayType(displayType) {
        this.targetFieldLabelOptions = [];
        let validTargetTypes = this.validTargetTypesBySourceType[displayType];

        for (let i = 0; i < validTargetTypes.length; i++) {
            let validType = validTargetTypes[i];
            let validTargetTypesByLabel = this.targetFieldsByLabelByDisplayType[validType] || [];

            this.targetFieldLabelOptions.push(...validTargetTypesByLabel);
        }

        this.targetFieldLabelOptions = this.sortBy(this.targetFieldLabelOptions, 'label');
    }

    /*******************************************************************************
    * @description Handles the onchange event for the bdiFieldMappingModalComboboxSearch
    * targetFieldLabel, sets the value for both targetFieldLabel and targetFieldAPIName.
    *
    * @param {object} event: Event containing combobox selection details
    */
    handleTargetFieldLabelChange(event) {
        if (event) {
            this.selectedTargetFieldAPIName = event.detail.value;
            let fieldInfo = this.targetFieldsByAPIName[this.selectedTargetFieldAPIName];
            this.selectedTargetFieldLabel = fieldInfo.label;
            this.selectedTargetFieldDisplayType = this.toTitleCase(fieldInfo.displayType);
            this.selectedTargetFieldDisplayTypeLabel =
                this.labelsByDisplayType[this.selectedTargetFieldDisplayType];
            this.hasTargetFieldErrors = false;
        } else {
            this.selectedTargetFieldAPIName = undefined;
            this.selectedTargetFieldLabel = undefined;
            this.selectedTargetFieldDisplayType = undefined;
        }
    }

    /*******************************************************************************
    * @description Creates and dispatches a ShowToastEvent
    *
    * @param {string} title: Title of the toast, dispalyed as a heading.
    * @param {string} message: Message of the toast. It can contain placeholders in
    * the form of {0} ... {N}. The placeholders are replaced with the links from
    * messageData param
    * @param {string} mode: Mode of the toast
    * @param {array} messageData: List of values that replace the {index} placeholders
    * in the message param
    */
    showToast(title, message, variant, mode, messageData) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode,
            messageData: messageData
        });
        this.dispatchEvent(event);
    }

    /*******************************************************************************
    * @description Creates and dispatches an error toast
    *
    * @param {object} error: Event holding error details
    */
    handleError(error) {
        console.log('Error: ', error);
        if (error && error.status && error.body) {
            this.showToast(`${error.status} ${error.statusText}`, error.body.message, 'error', 'sticky');
        } else if (error && error.name && error.message) {
            this.showToast(`${error.name}`, error.message, 'error', 'sticky');
        } else {
            this.showToast(stgUnknownError, '', 'error', 'sticky');
        }
    }

    /*******************************************************************************
    * @description Sorts a list by a property
    *
    * @param {array} list: List to be sorted
    * @param {string} sortedBy: Property to sort by
    */
    sortBy(list, sortedBy) {
        return list.sort((a, b) => { return (a[sortedBy] > b[sortedBy]) ? 1 : -1} );
    }

    /*******************************************************************************
    * @description Parse proxy objects for debugging, mutating, etc
    *
    * @param {object} obj: Object to be parsed
    */
    parse(obj) {
       return JSON.parse(JSON.stringify(obj));
    }

    /*******************************************************************************
    * @description Title cases a string
    *
    * @param {string} string: String to be title cased
    */
    toTitleCase(string) {
        string = string.toLowerCase().split(' ');
        for (let i = 0; i < string.length; i++) {
            string[i] = string[i].charAt(0).toUpperCase() + string[i].slice(1);
        }
        return string.join(' ');
    }
}