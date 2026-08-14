# Campus CESA — Recorrido de infraestructura

Web app estática que muestra el recorrido fotográfico de la Iniciativa Campus CESA (Dirección de Infraestructura): un comparador antes/después por cada espacio intervenido, con galería y detalle de cada proyecto.

## Ver el sitio

Abre [`web/index.html`](web/index.html) directamente en el navegador, o sirve la carpeta con cualquier servidor estático:

```bash
cd campus-cesa
python3 -m http.server 8000
# abrir http://localhost:8000/web/index.html
```

No requiere build ni dependencias.

## Estructura

- `web/` — código de la app (`index.html`, `styles.css`, `data.js`, `app.js`)
- `Registro fotografico/` — fotos antes/durante/después por espacio, organizadas por carpeta
- `Justificacion proyectos/` — brief e insumos del requerimiento original

## Contenido

10 espacios documentados: modernización de salones, Cafetería Casa Incolda, Casa Biblioteca, CESA Contigo, baños del auditorio, hall y baños Casa Vargas, alfombras en varias sedes, oficina de Éxito Estudiantil, zona de descanso Casa Lleras y control de acceso inteligente.
