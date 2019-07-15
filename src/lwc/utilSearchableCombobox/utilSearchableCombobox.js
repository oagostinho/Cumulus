import { LightningElement, api, track } from 'lwc';
import { fireEvent } from 'c/pubsubNoPageRef';

const DELAY = 300;

export default class utilSearchableCombobox extends LightningElement {

    @api name;
    @api comboboxLabel;
    @api searchInputLabel;
    @api selectedFieldValue;
    @api options;
    @api parentListenerEventName;
    @api fieldLevelHelp;
    @api disabled;
    @api hasErrors;

    @track isSearchOpen;
    @track searchKey = '';
    @track searchResults;
    @track areSearchResultsVisible = false;

    get comboboxClass() {
        return this.hasErrors ? 'slds-has-error slds-listbox_extension' : 'slds-listbox_extension';
    }

    showSearch() {
        this.isSearchOpen = true;
        fireEvent(this.pageRef, this.parentListenerEventName, undefined);
    }

    hideSearch() {
        this.isSearchOpen = false;
        this.areSearchResultsVisible = false;
    }

    debounceOnSearchKeyChange(event) {
        // Debouncing this method: Do not update the reactive property as long as this function is
        // being called within a delay of DELAY. This is to avoid a very large number of Apex method calls.
        window.clearTimeout(this.delayTimeout);
        const searchKey = event.target.value;
        if (searchKey && searchKey.length > 1) {
            this.delayTimeout = setTimeout(() => {
                this.handleSearchkeyChange(searchKey);
            }, DELAY);
        } else {
            this.searchResults = undefined;
        }
    }

    handleSearchkeyChange(searchKey) {
        let results = [];

        for(let i = 0; i < this.options.length; i++) {
            if (this.options[i].label.toLowerCase().indexOf(searchKey.toLowerCase()) != -1) {
                let result = {
                    id: i,
                    label: this.options[i].label,
                    value: this.options[i].value
                }
                results.push(result);
            }
        }

        this.searchResults = results;
        this.areSearchResultsVisible = true;
    }

    selectSearchResult(event) {
        let result = {
            detail: {
                label: event.target.dataset.fieldLabel,
                value: event.target.dataset.fieldValue
            }
        }

        fireEvent(this.pageRef, this.parentListenerEventName, result);

        this.selectedFieldValue = result.detail.value;
        this.searchResults = undefined;
        this.isSearchOpen = false;
        this.areSearchResultsVisible = false;
    }

    handleFieldChange(event) {
        fireEvent(this.pageRef, this.parentListenerEventName, event);
    }
}