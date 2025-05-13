// URL base de la API (actualizada con la URL real de API Gateway)
const API_URL = 'https://7bkl0qudd4.execute-api.us-east-1.amazonaws.com';
        
// Estado de la aplicación
let libros = [];
let librosSeleccionados = [];


const api = fetch(API_URL + '/libros').then(response => response.json()).then(res =>{console.log(res.body.libros)})





// Elementos del DOM
const menuItems = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.section');
const mostrarSearch = document.getElementById('mostrar-search');
const eliminarSearch = document.getElementById('eliminar-search');
const librosList = document.getElementById('libros-list');
const eliminarLibrosList = document.getElementById('eliminar-libros-list');
const eliminarBtn = document.getElementById('eliminar-btn');
const agregarForm = document.getElementById('agregar-form');
const limpiarBtn = document.getElementById('limpiar-btn');
const agregarSuccess = document.getElementById('agregar-success');
const eliminarSuccess = document.getElementById('eliminar-success');

// Cambiar entre secciones
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const sectionId = item.getAttribute('data-section');
        
        // Actualizar menú activo
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Mostrar sección correspondiente
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${sectionId}-section`) {
                section.classList.add('active');
            }
        });
        
        // Si cambiamos a la sección de eliminar, actualizar la lista
        if (sectionId === 'eliminar') {
            renderEliminarLibros(libros);
        }
        
        // Ocultar mensajes de éxito al cambiar de sección
        agregarSuccess.style.display = 'none';
        eliminarSuccess.style.display = 'none';
    });
});

// Buscar libros (para mostrar)
mostrarSearch.addEventListener('input', () => {
    const searchTerm = mostrarSearch.value.toLowerCase();
    const filteredLibros = filtrarLibros(libros, searchTerm);
    renderLibros(filteredLibros);
});

// Buscar libros (para eliminar)
eliminarSearch.addEventListener('input', () => {
    const searchTerm = eliminarSearch.value.toLowerCase();
    const filteredLibros = filtrarLibros(libros, searchTerm);
    renderEliminarLibros(filteredLibros);
});

// Función para filtrar libros
function filtrarLibros(librosArray, searchTerm) {
    if (!searchTerm) return librosArray;
    
    return librosArray.filter(libro => {
        return (
            libro.titulo.toLowerCase().includes(searchTerm) ||
            libro.autor.toLowerCase().includes(searchTerm) ||
            libro.anio.toString().includes(searchTerm)
        );
    });
}

// Renderizar lista de libros (vista mostrar)
function renderLibros(api) {
    if (api.length === 0) {
        librosList.innerHTML = '<p>No hay libros disponibles.</p>';
        return;
    }
    
    librosList.innerHTML = '';
    api.forEach(libro => {
        const libroElement = document.createElement('div');
        libroElement.className = 'libro-item';
        libroElement.innerHTML = `
            <div class="libro-info">
                <div class="libro-titulo">${libro.titulo}</div>
                <div class="libro-autor">Autor: ${libro.autor}</div>
                <div class="libro-anio">Año: ${libro.anio}</div>
            </div>
        `;
        librosList.appendChild(libroElement);
    });
}

// Renderizar lista de libros (vista eliminar)
function renderEliminarLibros(librosArray) {
    if (librosArray.length === 0) {
        eliminarLibrosList.innerHTML = '<p>No hay libros disponibles.</p>';
        eliminarBtn.disabled = true;
        return;
    }
    
    eliminarLibrosList.innerHTML = '';
    librosSeleccionados = []; // Reiniciar selecciones
    
    librosArray.forEach(libro => {
        const libroElement = document.createElement('div');
        libroElement.className = 'libro-item';
        libroElement.innerHTML = `
            <div class="libro-info">
                <div class="libro-titulo">${libro.titulo}</div>
                <div class="libro-autor">Autor: ${libro.autor}</div>
                <div class="libro-anio">Año: ${libro.anio}</div>
            </div>
            <div class="checkbox-container">
                <input type="checkbox" class="libro-checkbox" data-id="${libro.id}">
            </div>
        `;
        eliminarLibrosList.appendChild(libroElement);
    });
    
    // Añadir listeners a los checkboxes
    document.querySelectorAll('.libro-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const libroId = checkbox.getAttribute('data-id');
            
            if (checkbox.checked) {
                librosSeleccionados.push(libroId);
            } else {
                librosSeleccionados = librosSeleccionados.filter(id => id !== libroId);
            }
            
            // Habilitar/deshabilitar botón de eliminar
            eliminarBtn.disabled = librosSeleccionados.length === 0;
        });
    });
}

// Manejar envío del formulario de agregar
agregarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Limpiar mensajes de error previos
    document.getElementById('titulo-error').textContent = '';
    document.getElementById('autor-error').textContent = '';
    document.getElementById('anio-error').textContent = '';
    
    // Obtener valores del formulario
    const titulo = document.getElementById('titulo').value.trim();
    const autor = document.getElementById('autor').value.trim();
    const anio = document.getElementById('anio').value;
    
    // Validaciones básicas
    let isValid = true;
    
    if (!titulo) {
        document.getElementById('titulo-error').textContent = 'El título es obligatorio';
        isValid = false;
    }
    
    if (!autor) {
        document.getElementById('autor-error').textContent = 'El autor es obligatorio';
        isValid = false;
    }
    
    if (!anio || anio < 1 || anio > 2025) {
        document.getElementById('anio-error').textContent = 'Ingrese un año válido (1-2025)';
        isValid = false;
    }
    
    if (!isValid) return;
    
    try {
        // Preparar los datos para AWS Lambda - DynamoDB
        const libroData = { 
            titulo, 
            autor, 
            anio: parseInt(anio)
            // No incluimos ID porque lo generará el backend
        };
        console.log('Datos a enviar:', libroData);
        
        // Enviar datos a la API
        //const response = await fetch(API_URL + '/libros')
        
        const response = await fetch(API_URL + '/libros', {
            method: 'POST',
            body: JSON.stringify(libroData)
        });
        console.log('Respuesta de la API:', response);

        //body: JSON.stringify(libroData)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al agregar el libro: ${response.status} - ${errorText}`);
        }
        
        // Limpiar formulario
        agregarForm.reset();
        
        // Mostrar mensaje de éxito
        agregarSuccess.style.display = 'block';
        setTimeout(() => {
            agregarSuccess.style.display = 'none';
        }, 3000);
        
        // Actualizar lista de libros
        fetchLibros();
    } catch (error) {
        console.error('Error en la solicitud POST:', error);
        alert('Ocurrió un error al agregar el libro');
    }
});

// Botón de limpiar formulario
limpiarBtn.addEventListener('click', () => {
    agregarForm.reset();
    document.getElementById('titulo-error').textContent = '';
    document.getElementById('autor-error').textContent = '';
    document.getElementById('anio-error').textContent = '';
});

// Botón de eliminar libros
eliminarBtn.addEventListener('click', async () => {
    if (librosSeleccionados.length === 0) return;
    
    if (confirm(`¿Está seguro de eliminar ${librosSeleccionados.length} libro(s)?`)) {
        try {
            // Eliminar libros seleccionados
            const promises = librosSeleccionados.map(id => 
                fetch(`${API_URL}/libros/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors'
                })
            );
            
            const results = await Promise.all(promises);
            
            // Verificar si todas las eliminaciones fueron exitosas
            const allSuccess = results.every(response => response.ok);
            if (!allSuccess) {
                console.warn('Algunas eliminaciones fallaron:', results);
            }
            
            // Mostrar mensaje de éxito
            eliminarSuccess.style.display = 'block';
            setTimeout(() => {
                eliminarSuccess.style.display = 'none';
            }, 3000);
            
            // Actualizar lista de libros
            fetchLibros();
            
            // Reiniciar selecciones y deshabilitar botón
            librosSeleccionados = [];
            eliminarBtn.disabled = true;
        } catch (error) {
            console.error('Error al eliminar libros:', error);
            alert('Ocurrió un error al eliminar los libros');
        }
    }
});

// Función para obtener libros de la API
async function fetchLibros() {
    try {
        librosList.innerHTML = '<div class="loading"></div>';
        eliminarLibrosList.innerHTML = '<div class="loading"></div>';
        
        const response = await fetch(API_URL + '/libros');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Error al obtener los libros: ${response.status} ${response.statusText}`);
        }
        
        libros = data.body.libros;
        
        // Verificar si es un array o si necesita ser extraído de una estructura
        if (!Array.isArray(libros)) {
            // A veces API Gateway/Lambda devuelve los datos en una estructura anidada
            if (libros.Items && Array.isArray(libros.Items)) {
                libros = libros.Items;
            } else if (libros.body) {
                // Manejar si la respuesta está en formato de string (común en API Gateway)
                try {
                    const bodyData = typeof libros.body === 'string' ? JSON.parse(libros.body) : libros.body;
                    libros = Array.isArray(bodyData) ? bodyData : 
                            (bodyData.Items && Array.isArray(bodyData.Items)) ? bodyData.Items : [];
                } catch (e) {
                    console.error('Error al procesar respuesta:', e);
                    libros = [];
                }
            } else {
                console.warn('Formato de respuesta inesperado:', libros);
                libros = [];
            }
        }
        
        // Actualizar ambas vistas
        renderLibros(libros);
        if (document.getElementById('eliminar-section').classList.contains('active')) {
            renderEliminarLibros(libros);
        }
    } catch (error) {
        console.error('Error al cargar libros:', error);
        librosList.innerHTML = '<p>Error al cargar los libros. Intente nuevamente.</p>';
        eliminarLibrosList.innerHTML = '<p>Error al cargar los libros. Intente nuevamente.</p>';
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Cargar libros desde la API real
    // Manejo de errores CORS específico para S3 y API Gateway
    fetchLibros().catch(error => {
        console.error('Error al inicializar la aplicación:', error);
        librosList.innerHTML = '<p>Error de conexión con el servidor. Verifique la configuración CORS en API Gateway.</p>';
        eliminarLibrosList.innerHTML = '<p>Error de conexión con el servidor. Verifique la configuración CORS en API Gateway.</p>';
    });
});