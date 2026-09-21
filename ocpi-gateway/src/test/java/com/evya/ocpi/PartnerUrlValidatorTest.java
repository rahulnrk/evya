package com.evya.ocpi;

import com.evya.ocpi.api.OcpiException;
import com.evya.ocpi.credentials.PartnerUrlValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The partner supplies a URL that we then fetch server-side, which is a textbook SSRF entry point.
 * Literal IPs are used here so the assertions never depend on DNS.
 */
class PartnerUrlValidatorTest {

    private final PartnerUrlValidator strict = new PartnerUrlValidator(false, false);
    private final PartnerUrlValidator lab = new PartnerUrlValidator(true, true);

    @Test
    @DisplayName("Loopback, private and link-local targets are refused")
    void internalTargetsAreRefused() {
        for (String url : new String[]{
                "https://127.0.0.1/versions",
                "https://10.1.2.3/versions",
                "https://192.168.1.10/versions",
                "https://172.16.5.4/versions",
                "https://169.254.169.254/latest/meta-data",
                "https://[::1]/versions"}) {
            assertThatThrownBy(() -> strict.validate(url))
                    .as("should refuse %s", url)
                    .isInstanceOf(OcpiException.class)
                    .hasMessageContaining("publicly routable");
        }
    }

    @Test
    @DisplayName("Plain http is refused outside the lab")
    void plainHttpIsRefused() {
        assertThatThrownBy(() -> strict.validate("http://93.184.216.34/versions"))
                .isInstanceOf(OcpiException.class)
                .hasMessageContaining("https");
    }

    @Test
    @DisplayName("A relative or schemeless url is refused")
    void malformedUrlIsRefused() {
        assertThatThrownBy(() -> strict.validate("/ocpi/versions"))
                .isInstanceOf(OcpiException.class);
        assertThatThrownBy(() -> strict.validate("https:///versions"))
                .isInstanceOf(OcpiException.class);
    }

    @Test
    @DisplayName("A public https target is accepted")
    void publicHttpsIsAccepted() {
        assertThat(strict.validate("https://93.184.216.34/ocpi/versions").getHost())
                .isEqualTo("93.184.216.34");
    }

    @Test
    @DisplayName("The lab profile may point at loopback over plain http")
    void labProfileAllowsLoopback() {
        assertThat(lab.validate("http://127.0.0.1:8099/partner/versions").getPort()).isEqualTo(8099);
    }
}
