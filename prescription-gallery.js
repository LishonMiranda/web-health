class PrescriptionGallery extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .toolbar {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .icon-btn { width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; }
                .glowing-btn { font-family: var(--font-family-headings); background: linear-gradient(135deg, var(--secondary-color), #ff6b81); color: #fff; border: none; border-radius: 10px; padding: 0.6rem 0.9rem; box-shadow: 0 6px 16px rgba(233,69,96,0.35); cursor: pointer; }
                /* Preview Pane */
                .preview { border: 1px solid var(--primary-color); border-radius: var(--border-radius-main); padding: 0.75rem; background: var(--bg-color); box-shadow: 0 4px 16px var(--shadow-color-dark); margin-bottom: 1rem; }
                .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem; }
                .preview-card { position: relative; background: var(--accent-color); border: 1px solid var(--primary-color); border-radius: 10px; overflow: hidden; }
                .preview-card img { width: 100%; height: 120px; object-fit: cover; display: block; }
                .remove-btn { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 8px; padding: 4px 8px; cursor: pointer; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
                .card { position: relative; background: var(--accent-color); border: 1px solid var(--primary-color); border-radius: 10px; overflow: hidden; }
                img { width: 100%; height: 140px; object-fit: cover; display: block; }
                .delete-btn { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 8px; padding: 4px 8px; cursor: pointer; }
                .empty { color: var(--font-color-dark); text-align: center; padding: 1rem; }
                /* Capture Modal */
                .modal { display: none; position: fixed; z-index: 1002; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
                .modal-content { background: var(--bg-color); border: 1px solid var(--primary-color); border-radius: var(--border-radius-main); width: 95%; max-width: 560px; margin: 5% auto; padding: 1rem; box-shadow: 0 8px 32px var(--shadow-color-dark); }
                .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem; }
                video, canvas { width: 100%; border-radius: 10px; background: #000; }
            </style>
            <div class="toolbar">
                <button id="captureBtn" class="glowing-btn" title="Capture from camera">📷 Capture</button>
                <input id="fileInput" type="file" accept="image/*" multiple style="display:none" />
                <button id="uploadBtn" class="glowing-btn" title="Upload photo">⬆ Upload</button>
            </div>
            <div id="previewPane" class="preview" style="display:none">
                <div class="preview-grid" id="previewGrid"></div>
                <div class="modal-actions">
                    <button id="clearPreview" class="glowing-btn">Clear</button>
                    <button id="confirmUpload" class="glowing-btn">Upload Selected</button>
                </div>
            </div>
            <div id="gallery" class="grid"></div>
            <div id="emptyState" class="empty" style="display:none;">No prescriptions yet. Capture or upload to get started.</div>

            <div id="captureModal" class="modal" aria-hidden="true">
                <div class="modal-content">
                    <video id="video" autoplay playsinline></video>
                    <canvas id="canvas" style="display:none"></canvas>
                    <div class="modal-actions">
                        <button id="closeCapture" class="glowing-btn">Close</button>
                        <button id="snap" class="glowing-btn">Snap</button>
                        <button id="save" class="glowing-btn" disabled>Save</button>
                    </div>
                </div>
            </div>
        `;

        this.galleryEl = this.shadowRoot.getElementById('gallery');
        this.emptyEl = this.shadowRoot.getElementById('emptyState');
        this.fileInput = this.shadowRoot.getElementById('fileInput');
        this.previewPane = this.shadowRoot.getElementById('previewPane');
        this.previewGrid = this.shadowRoot.getElementById('previewGrid');
        this.captureModal = this.shadowRoot.getElementById('captureModal');
        this.video = this.shadowRoot.getElementById('video');
        this.canvas = this.shadowRoot.getElementById('canvas');
        this.stream = null;
        this.selectedFiles = [];
        this.previewUrls = []; // Store object URLs for cleanup
    }

    connectedCallback() {
        // Wait for Firebase to be available
        if (typeof firebase === 'undefined') {
            console.error('Firebase is not loaded. Please ensure Firebase scripts are loaded.');
            return;
        }

        this.shadowRoot.getElementById('uploadBtn').addEventListener('click', () => {
            if (!firebase.auth().currentUser) {
                alert('Please log in to upload prescriptions.');
                return;
            }
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files, false));
        this.shadowRoot.getElementById('captureBtn').addEventListener('click', () => {
            if (!firebase.auth().currentUser) {
                alert('Please log in to capture prescriptions.');
                return;
            }
            this.openCapture();
        });
        this.shadowRoot.getElementById('closeCapture').addEventListener('click', () => this.closeCapture());
        this.shadowRoot.getElementById('snap').addEventListener('click', () => this.snap());
        this.shadowRoot.getElementById('save').addEventListener('click', () => this.saveSnap());
        this.shadowRoot.getElementById('confirmUpload').addEventListener('click', () => this.uploadSelected());
        this.shadowRoot.getElementById('clearPreview').addEventListener('click', () => this.clearPreview());
        this.ensureAuth(() => this.loadGallery());

        // Reload the gallery when auth state changes (e.g., after login)
        firebase.auth().onAuthStateChanged(() => {
            this.ensureAuth(() => this.loadGallery());
        });
    }

    ensureAuth(cb) {
        if (!firebase.auth().currentUser) {
            this.galleryEl.innerHTML = '';
            this.emptyEl.style.display = 'block';
            this.emptyEl.textContent = 'Please log in to manage your prescriptions.';
            return;
        }
        cb();
    }

    storagePath(fileName) {
        if (!firebase.auth().currentUser) {
            throw new Error('User not authenticated');
        }
        const uid = firebase.auth().currentUser.uid;
        if (!uid) {
            throw new Error('User ID not available');
        }
        return `users/${uid}/prescriptions/${fileName}`;
    }

    async loadGallery() {
        const uid = firebase.auth().currentUser?.uid;
        if (!uid) {
            console.log('No user ID available for loading gallery');
            return;
        }
        
        if (!firebase.storage) {
            console.error('Firebase Storage is not available');
            this.emptyEl.style.display = 'block';
            this.emptyEl.textContent = 'Firebase Storage is not available. Please check your configuration.';
            return;
        }
        
        const storage = firebase.storage();
        const listRef = storage.ref(`users/${uid}/prescriptions`);
        try {
            console.log('Loading gallery from:', `users/${uid}/prescriptions`);
            const res = await listRef.listAll();
            console.log('Gallery items found:', res.items.length);
            this.galleryEl.innerHTML = '';
            if (!res.items.length) {
                this.emptyEl.style.display = 'block';
                this.emptyEl.textContent = 'No prescriptions yet. Capture or upload to get started.';
                return;
            }
            this.emptyEl.style.display = 'none';
            for (const itemRef of res.items) {
                try {
                    const url = await itemRef.getDownloadURL();
                    this.addThumb(itemRef.name, url);
                } catch (urlError) {
                    console.error(`Failed to get URL for ${itemRef.name}:`, urlError);
                }
            }
        } catch (e) {
            console.error('Error loading gallery:', e);
            this.emptyEl.style.display = 'block';
            this.emptyEl.textContent = `Unable to load gallery: ${e.message || 'Please ensure you are logged in and storage rules allow access.'}`;
        }
    }

    addThumb(name, url) {
        const card = document.createElement('div');
        card.className = 'card';
        const img = document.createElement('img');
        img.src = url;
        img.alt = name;
        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.textContent = 'Delete';
        del.addEventListener('click', () => this.deleteItem(name, card));
        card.appendChild(img);
        card.appendChild(del);
        this.galleryEl.appendChild(card);
    }

    async deleteItem(name, cardEl) {
        if (!confirm('Delete this photo?')) return;
        const storage = firebase.storage();
        try {
            await storage.ref(this.storagePath(name)).delete();
            cardEl.remove();
            if (!this.galleryEl.children.length) this.emptyEl.style.display = 'block';
        } catch (e) {
            alert('Delete failed.');
            console.error(e);
        }
    }

    async handleFiles(fileList, immediate = false) {
        const files = Array.from(fileList || []);
        if (!files.length) return;

        // Check authentication first
        if (!firebase.auth().currentUser) {
            alert('Please log in to upload prescriptions.');
            this.fileInput.value = '';
            return;
        }

        if (immediate) {
            // Check if Firebase Storage is available
            if (!firebase.storage) {
                alert('Firebase Storage is not available. Please check your Firebase configuration.');
                this.fileInput.value = '';
                return;
            }

            const storage = firebase.storage();
            try {
                const baseTime = Date.now();
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                    // Ensure unique filename for each file
                    const safeName = `${baseTime}_${i}_${Math.random().toString(36).slice(2,10)}.${ext}`;
                    const ref = storage.ref(this.storagePath(safeName));
                    
                    console.log(`Uploading file ${i + 1}/${files.length}: ${safeName}`);
                    
                    await ref.put(file, { 
                        contentType: file.type || `image/${ext}`,
                        customMetadata: { 
                            email: firebase.auth().currentUser?.email || '',
                            originalName: file.name
                        } 
                    });
                    console.log(`Upload successful for ${safeName}`);
                }
                await this.loadGallery();
                alert(`Upload successful! ${files.length} file(s) uploaded.`);
            } catch (e) {
                console.error('Upload error:', e);
                const errorMsg = e.message || 'Check your login and storage rules.';
                alert(`Upload failed: ${errorMsg}`);
            } finally {
                this.fileInput.value = '';
            }
            return;
        }
        // Preview flow for local selection
        this.selectedFiles = files;
        this.renderPreview();
        this.fileInput.value = '';
    }

    renderPreview() {
        // Clean up previous object URLs
        this.previewUrls.forEach(url => URL.revokeObjectURL(url));
        this.previewUrls = [];
        this.previewGrid.innerHTML = '';
        
        if (!this.selectedFiles.length) {
            this.previewPane.style.display = 'none';
            return;
        }
        this.previewPane.style.display = 'block';
        this.selectedFiles.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            this.previewUrls.push(url);
            const card = document.createElement('div');
            card.className = 'preview-card';
            const img = document.createElement('img');
            img.src = url;
            img.alt = file.name;
            const remove = document.createElement('button');
            remove.className = 'remove-btn';
            remove.textContent = 'Remove';
            remove.addEventListener('click', () => {
                // Revoke the URL for this file
                URL.revokeObjectURL(url);
                this.previewUrls.splice(index, 1);
                this.selectedFiles.splice(index, 1);
                this.renderPreview();
            });
            card.appendChild(img);
            card.appendChild(remove);
            this.previewGrid.appendChild(card);
        });
    }

    clearPreview() {
        // Clean up object URLs
        this.previewUrls.forEach(url => URL.revokeObjectURL(url));
        this.previewUrls = [];
        this.selectedFiles = [];
        this.renderPreview();
    }

    async uploadSelected() {
        if (!this.selectedFiles.length) return;
        
        // Check authentication first
        if (!firebase.auth().currentUser) {
            alert('Please log in to upload prescriptions.');
            this.clearPreview();
            return;
        }

        // Check if Firebase Storage is available
        if (!firebase.storage) {
            alert('Firebase Storage is not available. Please check your Firebase configuration.');
            return;
        }

        const storage = firebase.storage();
        const confirmBtn = this.shadowRoot.getElementById('confirmUpload');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Uploading...';

        // Add timeout to prevent infinite waiting
        const timeout = setTimeout(() => {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
            alert('Upload is taking too long. Please check your internet connection and try again.');
        }, 60000); // 60 second timeout

        try {
            const uploadedFiles = [];
            const baseTime = Date.now();
            const uid = firebase.auth().currentUser.uid;
            
            console.log('Starting upload for user:', uid);
            console.log('Files to upload:', this.selectedFiles.length);
            
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i];
                const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                // Ensure unique filename for each file
                const safeName = `${baseTime}_${i}_${Math.random().toString(36).slice(2,10)}.${ext}`;
                const path = `users/${uid}/prescriptions/${safeName}`;
                const ref = storage.ref(path);
                
                console.log(`Uploading file ${i + 1}/${this.selectedFiles.length}: ${safeName} to ${path}`);
                console.log('File size:', file.size, 'bytes, type:', file.type);
                
                // Upload with error handling per file
                try {
                    const uploadTask = ref.put(file, { 
                        contentType: file.type || `image/${ext}`,
                        customMetadata: { 
                            email: firebase.auth().currentUser?.email || '',
                            originalName: file.name
                        } 
                    });
                    
                    // Wait for upload to complete
                    const snapshot = await uploadTask;
                    console.log(`Upload successful for ${safeName}:`, snapshot);
                    uploadedFiles.push(safeName);
                } catch (fileError) {
                    console.error(`Failed to upload ${file.name}:`, fileError);
                    console.error('Error code:', fileError.code);
                    console.error('Error message:', fileError.message);
                    throw new Error(`Failed to upload ${file.name}: ${fileError.message || fileError.code || 'Unknown error'}`);
                }
            }
            
            clearTimeout(timeout);
            console.log(`All ${uploadedFiles.length} files uploaded successfully`);
            
            // Clear preview and clean up URLs
            this.clearPreview();
            // Load gallery to show newly uploaded images
            await this.loadGallery();
            alert(`Upload successful! ${uploadedFiles.length} file(s) uploaded.`);
        } catch (e) {
            clearTimeout(timeout);
            console.error('Upload error details:', e);
            console.error('Error stack:', e.stack);
            const errorMsg = e.message || e.code || 'Check your login and storage rules.';
            alert(`Upload failed: ${errorMsg}`);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    }

    async openCapture() {
        try {
            this.captureModal.style.display = 'block';
            this.shadowRoot.getElementById('save').disabled = true;
            // reset preview state
            this.canvas.style.display = 'none';
            this.video.style.display = 'block';
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            this.video.srcObject = this.stream;
        } catch (e) {
            alert('Unable to access camera.');
            console.error(e);
            this.closeCapture();
        }
    }

    snap() {
        const video = this.video;
        const canvas = this.canvas;
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return;
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, w, h);
        // show preview and enable save
        this.canvas.style.display = 'block';
        this.video.style.display = 'none';
        this.shadowRoot.getElementById('save').disabled = false;
    }

    async saveSnap() {
        // Check authentication first
        if (!firebase.auth().currentUser) {
            alert('Please log in to save prescriptions.');
            this.closeCapture();
            return;
        }

        const blob = await new Promise(res => this.canvas.toBlob(res, 'image/jpeg', 0.9));
        if (!blob) {
            alert('Failed to capture image. Please try again.');
            return;
        }
        
        const saveBtn = this.shadowRoot.getElementById('save');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            await this.handleFiles([file], true);
            this.closeCapture();
        } catch (e) {
            alert('Save failed. Please try again.');
            console.error('Save error:', e);
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    closeCapture() {
        this.captureModal.style.display = 'none';
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        // reset preview UI
        this.canvas.style.display = 'none';
        this.video.style.display = 'block';
    }
}

customElements.define('prescription-gallery', PrescriptionGallery);


