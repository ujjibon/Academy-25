/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (
    config: any,
    { isServer, webpack }: { isServer: boolean; webpack: any }
  ) => {
    // Handle Node.js modules that are not available in the browser
    if (!isServer) {
      // pptxgenjs (and similar) use `import('node:fs')`; webpack must strip the
      // `node:` scheme before resolve.fallback can stub those modules.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: {
          request: string;
        }) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );

      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        events: false,
        child_process: false,
        cluster: false,
        dgram: false,
        dns: false,
        domain: false,
        module: false,
        readline: false,
        repl: false,
        string_decoder: false,
        timers: false,
        tty: false,
        vm: false,
        worker_threads: false,
        'image-size': false,
      };
    }
    return config;
  },
};

export default nextConfig;
