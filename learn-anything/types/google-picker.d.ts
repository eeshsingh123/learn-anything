interface Window {
    google: {
        picker: {
            PickerBuilder: new () => GooglePickerBuilder;
            DocsView: new () => GoogleDocsView;
            Action: {
                PICKED: string;
            };
            Feature: {
                MULTISELECT_ENABLED: string;
            };
        };
    };
    gapi: {
        load: (api: string, callback: () => void) => void;
    };
}

interface GoogleDocsView {
    setIncludeFolders(include: boolean): GoogleDocsView;
    setMimeTypes(mimeTypes: string): GoogleDocsView;
}

interface GooglePickerBuilder {
    addView(view: GoogleDocsView): GooglePickerBuilder;
    setOAuthToken(token: string): GooglePickerBuilder;
    setDeveloperKey(key: string): GooglePickerBuilder;
    setCallback(callback: (data: GooglePickerResponse) => void): GooglePickerBuilder;
    setOrigin(origin: string): GooglePickerBuilder;
    enableFeature(feature: string): GooglePickerBuilder;
    build(): GooglePicker;
}

interface GooglePicker {
    setVisible(visible: boolean): void;
}

interface GooglePickerDocument {
    id: string;
    name: string;
    mimeType: string;
}

interface GooglePickerResponse {
    action: string;
    docs: GooglePickerDocument[];
} 