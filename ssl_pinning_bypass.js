/**
 * SSL Pinning Bypass - Delayed Diagnostic Version
 * For authorized security testing only.
 */

const DELAY_MS = 10000;

// Enable or disable each hook independently
const ENABLE = {
    okhttp: true,
    okhttpLegacy: true,
    trustManagerImpl: true,
    customTrustManager: true,
    httpsURLConnection: true
};

console.log("[1] Script loaded");
console.log("[2] Waiting " + DELAY_MS + " ms before SSL hooks");

setTimeout(function () {

    console.log("[3] Starting SSL hooks");

    Java.perform(function () {

        console.log("[4] Java.perform OK");

        // 1. OkHttp3 CertificatePinner
        if (ENABLE.okhttp) {
            try {
                var Pinner = Java.use("okhttp3.CertificatePinner");

                Pinner.check.overload(
                    "java.lang.String",
                    "java.util.List"
                ).implementation = function (host, certs) {
                    console.log("[BYPASS] OkHttp: " + host);
                    return;
                };

                console.log("[OK] OkHttp hook");
            } catch (e) {
                console.log("[ERROR] OkHttp: " + e);
            }
        }

        // 2. Legacy OkHttp
        if (ENABLE.okhttpLegacy) {
            try {
                var Pinner2 = Java.use("okhttp3.CertificatePinner");

                Pinner2.check.overload(
                    "java.lang.String",
                    "[Ljava.security.cert.Certificate;"
                ).implementation = function (host, certs) {
                    console.log("[BYPASS] Legacy OkHttp: " + host);
                    return;
                };

                console.log("[OK] Legacy OkHttp hook");
            } catch (e) {
                console.log("[ERROR] Legacy OkHttp: " + e);
            }
        }

        // 3. TrustManagerImpl
        if (ENABLE.trustManagerImpl) {
            try {
                var TrustManagerImpl = Java.use(
                    "com.android.org.conscrypt.TrustManagerImpl"
                );

                TrustManagerImpl.verifyChain.implementation =
                    function (
                        untrustedChain,
                        trustAnchorChain,
                        host,
                        clientAuth,
                        ocspData,
                        tlsSctData
                    ) {
                        console.log("[BYPASS] TrustManagerImpl: " + host);
                        return untrustedChain;
                    };

                console.log("[OK] TrustManagerImpl hook");
            } catch (e) {
                console.log("[ERROR] TrustManagerImpl: " + e);
            }
        }

        // 4. Custom X509TrustManager
        if (ENABLE.customTrustManager) {
            try {
                var X509TrustManager = Java.use(
                    "javax.net.ssl.X509TrustManager"
                );

                var SSLContext = Java.use(
                    "javax.net.ssl.SSLContext"
                );

                console.log("[INFO] Before Java.registerClass");

                var CustomTrustManager = Java.registerClass({
                    name: "com.bypass.TrustManager",
                    implements: [X509TrustManager],
                    methods: {
                        checkClientTrusted: function (chain, authType) {},

                        checkServerTrusted: function (chain, authType) {
                            console.log("[BYPASS] checkServerTrusted");
                        },

                        getAcceptedIssuers: function () {
                            return [];
                        }
                    }
                });

                console.log("[INFO] Java.registerClass OK");

                var managers = [CustomTrustManager.$new()];

                var context = SSLContext.getInstance("TLS");
                context.init(null, managers, null);

                console.log("[OK] Custom TrustManager initialized");

            } catch (e) {
                console.log("[ERROR] Custom TrustManager: " + e);
            }
        }

        // 5. HttpsURLConnection
        if (ENABLE.httpsURLConnection) {
            try {
                var HTTPS = Java.use(
                    "javax.net.ssl.HttpsURLConnection"
                );

                HTTPS.setDefaultHostnameVerifier.implementation =
                    function (verifier) {
                        console.log("[BYPASS] HostnameVerifier");
                        return;
                    };

                console.log("[OK] HttpsURLConnection hook");

            } catch (e) {
                console.log("[ERROR] HttpsURLConnection: " + e);
            }
        }

        console.log("[SUCCESS] SSL hooks initialized");
    });

}, DELAY_MS);

setTimeout(function () {
    console.log("[HEALTH] Process survived 20 seconds");
}, 20000);
