/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
        // Enable instrumentation hook for server startup
        instrumentationHook: true,
    },
    images: {
        domains: ['localhost'],
    },
    // Ensure server-only modules are not bundled on client
    webpack: (config, { isServer }) => {
        // Shared externals
        const sharedExternals = [
            'pg',
            'pg-native',
            'pg-hstore',
            'pg-connection-string',
            '@prisma/client',
            'prisma',
            'bcryptjs',
            'jsonwebtoken',
            'winston',
            'node-cron'
        ];

        if (!isServer) {
            // Don't bundle server-only modules on client-side
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                dns: false,
                crypto: false,
                path: false,
                stream: false,
                http: false,
                https: false,
                os: false,
            };

            // Exclude server-only packages from client bundle
            config.externals = config.externals || [];
            config.externals.push(...sharedExternals);
        } else {
            // On server, treat these as external to avoid bundling Node-only native modules
            // and causing resolution issues with 'fs' in some environments
            config.externals = config.externals || [];
            config.externals.push(...sharedExternals);
        }
        return config;
    },
}

export default nextConfig
