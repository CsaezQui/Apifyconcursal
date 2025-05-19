# Consulta Publicidad Concursal

Este actor de Apify automatiza la consulta en el Registro Público Concursal de España y extrae, para cada resultado, el nombre de la empresa y su documento identificativo (CIF/NIF).

## Uso

1. Clona este repositorio.
2. Ejecuta `npm install`.
3. Corre el actor con `npm start` o `npx apify run`.
4. El resultado (un dataset JSON) contendrá objetos así:

```json
{ "concurso": true, "nombre": "OFFICE 24 SOLUTIONS S.L.", "documento": "B64065519" }
