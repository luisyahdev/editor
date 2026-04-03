const CloudManager = {
    // 1. Cargamos lo que haya en localStorage (sin valores por defecto engañosos)
    config: JSON.parse(localStorage.getItem('cloud_config')) || {
        provider: null, // No hay proveedor hasta que el usuario elija uno
        url: '',
        key: '',
        bucket: ''
    },
    pendingAction: null,

    // 2. Método para verificar si la nube está lista
    isReady() {
        return this.config.provider !== null && this.config.url !== '' && this.config.key !== '';
    },

    // 3. Inicializador Inteligente
    init() {
        if (!this.isReady()) {
            console.warn("⚠️ Cloud no configurado. El sistema funcionará solo en modo Local.");
            return;
        }

        const { provider, url, key } = this.config;

        // Aquí es donde ocurre la magia dinámica
        switch (provider) {
            case 'supabase':
                if (typeof supabase !== 'undefined') {
                    window.cloudClient = supabase.createClient(url, key);
                    // console.log("✅ Cliente Supabase vinculado.");
                }

                break;

            case 'firebase':
                // Aquí iría tu lógica de Firebase en el futuro
                // window.cloudClient = initializeFirebase(url, key);
                break;

            default:
            // console.error("Proveedor no soportado:", provider);
        }
    },

    save(newConfig) {
        this.config = { ...this.config, ...newConfig };
        localStorage.setItem('cloud_config', JSON.stringify(this.config));
        this.init(); // Reinicializamos con los nuevos datos
    },

    checkConnection(callback) {
        if (this.config.url && this.config.key && window.cloudClient) {
            return true;
        }

        // Guardamos la función que el usuario quería ejecutar
        this.pendingAction = callback;

        // Si no hay conexión, mostramos el aviso
        showDialog({
            title: 'Cloud Connection Required',
            message: 'To perform this action, you need to configure your Cloud settings (URL, API Key, and Bucket).',
            confirmText: 'Configure Now',
            type: 'warning',
            onConfirm: () => openCloudModal()
        });

        return false;
    },
    // Nuevo método para ejecutar lo que quedó pendiente
    resumePendingAction() {
        if (this.pendingAction && typeof this.pendingAction === 'function') {
            // console.log("▶️ Resumiendo acción pendiente...");
            this.pendingAction();
            this.pendingAction = null; // Limpiamos para que no se repita
        }
    }
};

// Arrancamos al cargar el script
CloudManager.init();

// const CloudManager = {
//     // 1. Intentar cargar desde localStorage al arrancar
//     config: JSON.parse(localStorage.getItem('cloud_config')) || {
//         provider: 'supabase',
//         url: '',
//         key: '',
//         bucket: ''
//     },

//     // 2. Guardar y persistir
//     save(newConfig) {
//         this.config = { ...this.config, ...newConfig };
//         localStorage.setItem('cloud_config', JSON.stringify(this.config));

//         // Cada vez que guardamos, reinicializamos el cliente de Supabase
//         this.init();
//     },

//     // 3. Inicializar el cliente globalmente
//     init() {
//         const { url, key } = this.config;
//         if (url && key) {
//             try {
//                 // Creamos el cliente en el objeto window para que todas tus funciones lo vean
//                 window.supabaseClient = supabase.createClient(url, key);
//                 console.log("☁️ Cloud Client Inicializado correctamente.");
//             } catch (err) {
//                 console.error("Error al inicializar el cliente Cloud:", err);
//             }
//         }
//     }
// };

// // Ejecutamos la inicialización al cargar el script
// CloudManager.init();