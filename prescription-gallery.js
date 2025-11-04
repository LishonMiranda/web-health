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
                <input id="fileInput" type="file" accept="image/*" style="display:none" />
                <button id="uploadBtn" class="glowing-btn" title="Upload photo">⬆ Upload</button>
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
        this.captureModal = this.shadowRoot.getElementById('captureModal');
        this.video = this.shadowRoot.getElementById('video');
        this.canvas = this.shadowRoot.getElementById('canvas');
        this.stream = null;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('uploadBtn').addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.shadowRoot.getElementById('captureBtn').addEventListener('click', () => this.openCapture());
        this.shadowRoot.getElementById('closeCapture').addEventListener('click', () => this.closeCapture());
        this.shadowRoot.getElementById('snap').addEventListener('click', () => this.snap());
        this.shadowRoot.getElementById('save').addEventListener('click', () => this.saveSnap());
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
        const uid = firebase.auth().currentUser.uid;
        return `users/${uid}/prescriptions/${fileName}`;
    }

    async loadGallery() {
        const uid = firebase.auth().currentUser?.uid;
        if (!uid) return;
        const storage = firebase.storage();
        const listRef = storage.ref(`users/${uid}/prescriptions`);
        try {
            const res = await listRef.listAll();
            this.galleryEl.innerHTML = '';
            if (!res.items.length) {
                this.emptyEl.style.display = 'block';
                return;
            }
            this.emptyEl.style.display = 'none';
            for (const itemRef of res.items) {
                const url = await itemRef.getDownloadURL();
                this.addThumb(itemRef.name, url);
            }
        } catch (e) {
            console.error(e);
            this.emptyEl.style.display = 'block';
            this.emptyEl.textContent = 'Unable to load gallery. Please ensure you are logged in and storage rules allow access.';
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

    async handleFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        const storage = firebase.storage();
        try {
            for (const file of files) {
                const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                const safeName = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
                const ref = storage.ref(this.storagePath(safeName));
                await ref.put(file, { contentType: file.type, customMetadata: { email: firebase.auth().currentUser?.email || '' } });
            }
            await this.loadGallery();
        } catch (e) {
            alert('Upload failed. Check your login and storage rules.');
            console.error(e);
        } finally {
            this.fileInput.value = '';
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
        const blob = await new Promise(res => this.canvas.toBlob(res, 'image/jpeg', 0.9));
        if (!blob) return;
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        await this.handleFiles([file]);
        this.closeCapture();
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


