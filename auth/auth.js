const secret = process.env.JWT_SECRET;
console.log("Clave secreta que se usará para la verificación en auth.js:", secret);
console.log("Longitud de la clave secreta en auth.js:", secret.length);

const jwt = require('jsonwebtoken');

function isAuthorized(role) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            console.log("authHeader es undefined. Token faltante.");
            return res.status(401).json({ error: 'Acceso no autorizado. Token faltante.' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.log("authHeader no comienza con 'Bearer '. Token inválido.");
            return res.status(401).json({ error: 'Acceso no autorizado. Token inválido.' });
        }

        try {
            const token = authHeader.split(' ')[1]; // Ahora es seguro acceder a authHeader
            console.log("Token a verificar:", token); // Esta línea ahora está bien ubicada.

            const secret = process.env.JWT_SECRET;
            console.log("Clave secreta que se usará para la verificación en auth.js:", secret);
            console.log("Longitud de la clave secreta en auth.js:", secret.length);

            const decoded = jwt.verify(token, secret);
            console.log("Token decodificado:", decoded);

            req.user = decoded;

            if (role && decoded.role !== role) {
                return res.status(403).json({ error: 'Acceso prohibido. No tiene permisos de administrador.' });
            }

            next();
        } catch (error) {
            console.error("Error al verificar el token en auth.js:", error);
            console.error("Tipo de error:", error.name);
            console.error("Mensaje del error:", error.message);
            return res.status(401).json({ error: 'Acceso no autorizado. Token inválido.' });
        }
    };
}

module.exports = { isAuthorized };

