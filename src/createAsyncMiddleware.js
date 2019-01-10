function createAsyncMiddleware(middleware) {
    return async function(...args) {
        try {
            await middleware(...args);
        } catch (error) {
            const next = args[args.length - 1];
            
            next(error);
        }
    };
}

module.exports = {
    createAsyncMiddleware
};
