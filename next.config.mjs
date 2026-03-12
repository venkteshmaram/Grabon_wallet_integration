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
        if (!isServer) {
            // Don't bundle server-only modules on client-side
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                dns: false,
                pg: false,
                'pg-native': false,
                'pg-hstore': false,
                'pg-query-stream': false,
                'pg-cursor': false,
                'pg-pool': false,
                'pg-types': false,
                'pg-connection-string': false,
                'pg-packet-stream': false,
                'pg-protocol': false,
                crypto: false,
                path: false,
                stream: false,
                http: false,
                https: false,
                zlib: false,
                os: false,
                url: false,
                querystring: false,
                buffer: false,
                util: false,
                events: false,
                assert: false,
                constants: false,
                timers: false,
                string_decoder: false,
                dgram: false,
                vm: false,
                process: false,
                child_process: false,
                cluster: false,
                module: false,
                v8: false,
                async_hooks: false,
                inspector: false,
                perf_hooks: false,
                trace_events: false,
                worker_threads: false,
                diagnostics_channel: false,
                stream: false,
                _stream_duplex: false,
                _stream_passthrough: false,
                _stream_readable: false,
                _stream_transform: false,
                _stream_writable: false,
            };

            // Exclude server-only packages from client bundle
            config.externals = config.externals || [];
            config.externals.push(
                'pg',
                'pg-native',
                'pg-hstore',
                '@prisma/client',
                'prisma',
                'bcryptjs',
                'jsonwebtoken',
                'winston',
                'node-cron'
            );
        }
        return config;
    },
}

export default nextConfig
