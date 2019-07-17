import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { registerListener, unregisterAllListeners, fireEvent} from 'c/pubsubNoPageRef';
import getFieldMappingSetName
    from '@salesforce/apex/BDI_ManageAdvancedMappingCtrl.getFieldMappingSetName';
import getFieldMappingsByObjectAndFieldSetNames
    from '@salesforce/apex/BDI_ManageAdvancedMappingCtrl.getFieldMappingsByObjectAndFieldSetNames';
import createDataImportFieldMapping
    from '@salesforce/apex/BDI_ManageAdvancedMappingCtrl.createDataImportFieldMapping';
import getObjectFieldDescribes
    from '@salesforce/apex/BDI_ManageAdvancedMappingCtrl.getObjectFieldDescribes';

/*******************************************************************************
* @description Import Custom Labels
*/
import bdiFieldMapping from '@salesforce/label/c.bdiFieldMapping';
import bdiFieldMappingsLabel from '@salesforce/label/c.bdiFieldMappings';
import bdiFMUIBackToMapGroup from '@salesforce/label/c.bdiFMUIBackToMapGroup';
import bdiFMUIDescription from '@salesforce/label/c.bdiFMUIDescription';
import bdiFMUILongDeployment from '@salesforce/label/c.bdiFMUILongDeployment';
import bdiFMUILongDeploymentLink from '@salesforce/label/c.bdiFMUILongDeploymentLink';
import bdiFMUILongDeploymentMessage from '@salesforce/label/c.bdiFMUILongDeploymentMessage';
import bdiFMUINewFieldMapping from '@salesforce/label/c.bdiFMUINewFieldMapping';
import bdiFMUINoFieldMappings from '@salesforce/label/c.bdiFMUINoFieldMappings';
import bdiFMUISourceObject from '@salesforce/label/c.bdiFMUISourceObject';
import bdiFMUISuccessful from '@salesforce/label/c.bdiFMUISuccessful';
import bdiFMUITarget from '@salesforce/label/c.bdiFMUITarget';
import bdiFMUITryAgain from '@salesforce/label/c.bdiFMUITryAgain';
import bdiFMUIUnsuccessful from '@salesforce/label/c.bdiFMUIUnsuccessful';
import stgHelpAdvancedMapping3 from '@salesforce/label/c.stgHelpAdvancedMapping3';
import stgLabelObject from '@salesforce/label/c.stgLabelObject';
import stgUnknownError from '@salesforce/label/c.stgUnknownError';

/*******************************************************************************
* @description Import Custom Labels for the lightning:datatable
*/
import bdiFMUIDatatableMapsTo from '@salesforce/label/c.bdiFMUIDatatableMapsTo';
import bdiFMUIDataType from '@salesforce/label/c.bdiFMUIDataType';
import bdiFMUIFieldAPIName from '@salesforce/label/c.bdiFMUIFieldAPIName';
import bdiFMUIFieldLabel from '@salesforce/label/c.bdiFMUIFieldLabel';
import bgeActionDelete from '@salesforce/label/c.bgeActionDelete';
import stgBtnEdit from '@salesforce/label/c.stgBtnEdit';

/*******************************************************************************
* @description Column Action definitions for the lightning:datatable
*/
const actions = [
    { label: stgBtnEdit, name: 'edit' },
    { label: bgeActionDelete, name: 'delete' },
];

/*******************************************************************************
* @description Column definitions for the lightning:datatable
*/
const columns = [
    { label: bdiFMUIFieldLabel, fieldName: 'xxPrefixTokenxx_Source_Field_Label_xxSuffixTokenxx', type: 'text', sortable: true },
    { label: bdiFMUIFieldAPIName, fieldName: 'xxPrefixTokenxx_Source_Field_API_Name_xxSuffixTokenxx', type: 'text', sortable: true },
    { label: bdiFMUIDataType, fieldName: 'Source_Field_Display_Type_Label', type: 'text', initialWidth: 125, sortable: true },
        {
            label: bdiFMUIDatatableMapsTo, fieldName: '', type: 'text', fixedWidth: 95,
            cellAttributes: { alignment: 'center', iconName: { fieldName: 'Maps_To_Icon' } }
        },
    { label: bdiFMUIFieldLabel, fieldName: 'xxPrefixTokenxx_Target_Field_Label_xxSuffixTokenxx', type: 'text', sortable: true },
    { label: bdiFMUIFieldAPIName, fieldName: 'xxPrefixTokenxx_Target_Field_API_Name_xxSuffixTokenxx', type: 'text', sortable: true },
    { label: bdiFMUIDataType, fieldName: 'Target_Field_Display_Type_Label', type: 'text', initialWidth: 125, sortable: true },
    { type: 'action', typeAttributes: { rowActions: actions } }
];

export default class bdiFieldMappings extends LightningElement {

    customLabels = {
        bdiFieldMappingsLabel,
        bdiFMUIBackToMapGroup,
        bdiFMUIDescription,
        bdiFMUINewFieldMapping,
        bdiFMUINoFieldMappings,
        bdiFMUISourceObject,
        bdiFMUITarget,
        stgHelpAdvancedMapping3,
        stgLabelObject,
    }

    @api objectMapping;
    @api diFieldDescribes;
    @api targetObjectFieldDescribes;

    @track displayFieldMappings = false;
    @track isLoading = true;
    @track columns = columns;
    @track sortedBy;
    @track sortDirection;
    @track fieldMappingSetName;
    @track fieldMappings;

    deploymentTimer;
    deploymentTimeout = 10000;

    @api
    get noFieldMappings() {
        return !this.fieldMappings || this.fieldMappings.length === 0;
    }

    @api
    refresh() {
        this.init();
    }

    handleNavButton() {
        fireEvent(this.pageRef, 'showobjectmappings');
    }

    connectedCallback() {
        registerListener('showobjectmappings', this.handleShowObjectMappings, this);
        registerListener('showfieldmappings', this.handleShowFieldMappings, this);
        registerListener('deploymentResponse', this.handleDeploymentResponse, this);
        registerListener('startDeploymentTimeout', this.handleDeploymentTimeout, this);
        registerListener('refresh', this.refresh, this);
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    /*******************************************************************************
    * @description Group up various get data calls to apex
    */
    init = async() => {
        try {
            this.isLoading = true;

            // Get all the data import field describes
            if (!this.diFieldDescribes) {
                this.diFieldDescribes =
                    await getObjectFieldDescribes({objectName: 'DataImport__c'});
            }

            // Get all the target object field describes based on the currently
            // selected object mapping
            let objectAPIName =
                this.objectMapping.Object_API_Name__c || this.objectMapping.npsp__Object_API_Name__c;
            this.targetObjectFieldDescribes =
                await getObjectFieldDescribes({objectName: objectAPIName});

            // Get the field mapping set name from the data import custom settings
            this.fieldMappingSetName =
                await getFieldMappingSetName();

            // Get all the field mappings for the currently selected object mapping
            this.fieldMappings =
                await getFieldMappingsByObjectAndFieldSetNames({
                    objectName: this.objectMapping.DeveloperName,
                    fieldMappingSetname: this.fieldMappingSetName
                });

            if (this.fieldMappings && this.fieldMappings.length > 0) {
                this.fieldMappings = this.sortData(
                    this.fieldMappings,
                    'xxPrefixTokenxx_Source_Field_Label_xxSuffixTokenxx',
                    'asc');
            }

            this.isLoading = false;

        } catch(error) {
            this.handleError(error);
        }
    }

    /*******************************************************************************
    * @description Handles the timeout toast of deployments whenever a deployment
    * that's registered with platformEventListener takes 10 seconds or longer to
    * send out a response.
    */
    handleDeploymentTimeout(event) {
        let that = this;
        this.deploymentTimer = setTimeout(function() {
            that.isLoading = false;
            fireEvent(this.pageRef, 'closeModal', {});

            let url =
                '/lightning/setup/DeployStatus/page?' +
                'address=%2Fchangemgmt%2FmonitorDeploymentsDetails.apexp%3FasyncId%3D' +
                event.deploymentId +
                '%26retURL%3D%252Fchangemgmt%252FmonitorDeployment.apexp';

            this.showToast(
                bdiFMUILongDeployment,
                bdiFMUILongDeploymentMessage + ' {0}.',
                'warning',
                'sticky',
                [{url, label: bdiFMUILongDeploymentLink}]);
        }, this.deploymentTimeout, that);
    }

    /*******************************************************************************
    * @description Listens for an event from the platformEventListener component.
    * Upon receiving an event refreshes the field mappings records, closes the modal,
    * and creates a toast.
    *
    * @param {object} platformEvent: Object containing the platform event payload
    */
    handleDeploymentResponse(platformEvent) {
        clearTimeout(this.deploymentTimer);
        fireEvent(this.pageRef, 'refresh', {});
        fireEvent(this.pageRef, 'closeModal', {});

        const payload = platformEvent.response.data.payload;
        const status = payload.Status__c || payload.npsp__Status__c;
        const successMessage = `${bdiFieldMapping} ${bdiFMUISuccessful}.`;
        const failMessage = `${bdiFieldMapping} ${bdiFMUIUnsuccessful}. ${bdiFMUITryAgain}.`;
        const succeeded = status === 'Succeeded';

        this.showToast(
            `${succeeded ? successMessage : failMessage}`,
            '',
            succeeded ? 'success' : 'error');
    }

    /*******************************************************************************
    * @description Hides the field mappings component and fires an event to the parent
    * object mappings component to show itself.
    */
    handleShowObjectMappings() {
        this.displayFieldMappings = false;
    }

    /*******************************************************************************
    * @description Shows the field mappings component and forces a refresh to get
    * fresh field mapping records for the currently selected object mapping.
    */
    handleShowFieldMappings(event) {
        this.objectMapping = event.objectMapping;
        this.displayFieldMappings = true;
        this.init();
    }

    /*******************************************************************************
    * @description Opens the field mapping modal passing in relevant details on
    * the currently selected object and child field mappings.
    */
    handleOpenModal() {
        fireEvent(this.pageRef, 'openModal', {
            objectMapping: this.objectMapping,
            row: undefined,
            fieldMappings: this.fieldMappings
        });
    }

    /*******************************************************************************
    * @description Handles the onsort event from the lightning:datatable
    *
    * @param {object} event: Event holding column details of the action
    */
    handleColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.fieldMappings = this.sortData(this.fieldMappings, this.sortedBy, this.sortedDirection);
    }

    /*******************************************************************************
    * @description Sorts the given list by field name and direction
    *
    * @param {array} list: List to be sorted
    * @param {string} fieldName: Property to sort by
    * @param {string} sortDirection: Direction to sort by (i.e. 'asc' or 'desc')
    */
    sortData(list, fieldName, sortDirection) {
        const data = JSON.parse(JSON.stringify(list));
        const key =(a) => a[fieldName];
        const reverse = sortDirection === 'asc' ? 1 : -1;

        data.sort((a,b) => {
            let valueA = key(a) ? key(a).toLowerCase() : '';
            let valueB = key(b) ? key(b).toLowerCase() : '';
            return reverse * ((valueA > valueB) - (valueB > valueA));
        });

        return data;
    }

    /*******************************************************************************
    * @description Action handler for datatable row actions (i.e. edit, delete)
    *
    * @param {object} event: Event containing row details of the action
    */
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {

            case 'delete':
                this.isLoading = true;
                row.xxPrefixTokenxx_Is_Deleted_xxSuffixTokenxx = true;

                createDataImportFieldMapping({fieldMappingString: JSON.stringify(row)})
                    .then((deploymentId) => {
                        this.handleDeleteDeploymentId(deploymentId);
                    })
                    .catch((error) => {
                        this.handleError(error);
                    });
                break;

            case 'edit':
                fireEvent(this.pageRef, 'openModal', {
                    objectMapping: this.objectMapping,
                    row: row,
                    fieldMappings: this.fieldMappings
                });
                break;

            default:
        }
    }

    /*******************************************************************************
    * @description Creates and dispatches a CustomEvent 'deployment' for deletion
    * letting the platformEventListener know that we have an id to register and monitor.
    * After dispatching the CustomEvent, start the deployment timeout.
    *
    * @param {string} deploymentId: Custom Metadata Deployment Id
    */
    handleDeleteDeploymentId(deploymentId) {
        const deploymentEvent = new CustomEvent('deployment', {
            bubbles: true,
            composed: true,
            detail: {deploymentId}
        });
        this.dispatchEvent(deploymentEvent);

        this.handleDeploymentTimeout({ deploymentId: deploymentId });
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
}