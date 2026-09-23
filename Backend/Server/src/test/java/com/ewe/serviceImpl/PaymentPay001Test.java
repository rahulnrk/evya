package com.ewe.serviceImpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.ewe.dao.GeneralDao;
import com.ewe.form.PaymentRequestDTO;
import com.ewe.pojo.AccountTransactions;
import com.ewe.pojo.Accounts;
import com.ewe.pojo.User;

/**
 * PAY-001 (S0): {@code POST /api/mobile/add_payment} credited the wallet the moment a Razorpay order was
 * created (status CREATED), before any server-side capture/verify — so any authenticated user could mint
 * balance and charge for free.
 *
 * <p>These are the GREEN acceptance tests for the fix: creating an order does not credit the wallet, and
 * the credit happens only in the signature-verified, idempotent (by order id) callback. No Razorpay
 * client is constructed (the order-id step is overridden) and signatures are computed locally, so no
 * network call is made and no real money moves.
 */
class PaymentPay001Test {

    private static final long USER_ID = 42L;
    private static final double INITIAL_BALANCE = 100.0d;
    private static final double TOP_UP_AMOUNT = 500.0d;
    private static final String ORDER_ID = "order_PAY001_TEST";
    private static final String PAYMENT_ID = "pay_PAY001_TEST";
    private static final String SECRET = "pay001_test_secret";

    /** Overrides the one method that would hit Razorpay, so createPayment runs offline. */
    private static final class TestService extends MobileAPIServiceImpl {
        @Override
        protected String createRazorpayOrder(Double amount) {
            return ORDER_ID;
        }
    }

    // ---- createPayment must NOT credit on order-create ----

    @Test
    @DisplayName("PAY-001: creating a payment order does not credit the wallet")
    @SuppressWarnings({ "unchecked", "rawtypes" })
    void createPayment_doesNotCreditWalletOnOrderCreate() throws Exception {
        TestService service = new TestService();
        GeneralDao generalDao = mock(GeneralDao.class);

        User user = new User();
        user.setId(USER_ID);
        Accounts account = new Accounts();
        account.setUser(user);
        account.setAccountBalance(INITIAL_BALANCE);

        when(generalDao.findOneSQLQuery(any(), contains("FROM users"), any())).thenReturn(user);
        when(generalDao.findOneSQLQuery(any(), contains("FROM accounts"), any())).thenReturn(account);
        when(generalDao.save(any())).thenAnswer(inv -> inv.getArgument(0));
        injectField(service, "generalDao", generalDao);

        PaymentRequestDTO dto = new PaymentRequestDTO();
        dto.setUserId(USER_ID);
        dto.setAmtCredit(TOP_UP_AMOUNT);

        AccountTransactions tx = service.createPayment(dto);

        assertThat(tx).isNotNull();
        assertThat(tx.getStatus()).isEqualTo("CREATED");
        assertThat(account.getAccountBalance())
                .as("an unverified CREATED order must not credit the wallet")
                .isEqualTo(INITIAL_BALANCE);
    }

    // ---- the credit happens only on a verified callback, exactly once ----

    @Test
    @DisplayName("PAY-001: a valid, verified callback credits the wallet once")
    void verifiedCallback_creditsOnce() throws Exception {
        Fixture f = new Fixture();

        String result = f.service.updatePaymentStatus(f.callback(sign(ORDER_ID, PAYMENT_ID, SECRET), null));

        assertThat(result).contains("COMPLETED");
        assertThat(f.account.getAccountBalance()).isEqualTo(INITIAL_BALANCE + TOP_UP_AMOUNT);
        assertThat(f.transaction.getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("PAY-001: a repeated callback does not credit twice")
    void repeatedCallback_doesNotDoubleCredit() throws Exception {
        Fixture f = new Fixture();
        String signature = sign(ORDER_ID, PAYMENT_ID, SECRET);

        f.service.updatePaymentStatus(f.callback(signature, null));
        String second = f.service.updatePaymentStatus(f.callback(signature, null));

        assertThat(second).contains("already completed");
        assertThat(f.account.getAccountBalance())
                .as("idempotent by order id: credited once only")
                .isEqualTo(INITIAL_BALANCE + TOP_UP_AMOUNT);
    }

    @Test
    @DisplayName("PAY-001: a forged/invalid signature does not credit")
    void invalidSignature_doesNotCredit() throws Exception {
        Fixture f = new Fixture();

        String result = f.service.updatePaymentStatus(f.callback("deadbeefforgedsignature", null));

        assertThat(result).contains("FAILED");
        assertThat(f.account.getAccountBalance())
                .as("a forged signature must never credit")
                .isEqualTo(INITIAL_BALANCE);
        assertThat(f.transaction.getStatus()).isEqualTo("FAILED");
    }

    @Test
    @DisplayName("PAY-001: a callback carrying an error does not credit")
    void failedPayment_doesNotCredit() throws Exception {
        Fixture f = new Fixture();

        String result = f.service.updatePaymentStatus(f.callback(sign(ORDER_ID, PAYMENT_ID, SECRET), "user_cancelled"));

        assertThat(result).contains("FAILED");
        assertThat(f.account.getAccountBalance()).isEqualTo(INITIAL_BALANCE);
    }

    // ---- helpers ----

    /** A service whose DAO returns a CREATED transaction + account for ORDER_ID, with the test secret set. */
    private static final class Fixture {
        final MobileAPIServiceImpl service = new TestService();
        final Accounts account = new Accounts();
        final AccountTransactions transaction = new AccountTransactions();

        @SuppressWarnings({ "unchecked", "rawtypes" })
        Fixture() throws Exception {
            account.setAccountBalance(INITIAL_BALANCE);
            transaction.setStatus("CREATED");
            transaction.setTransactionId(ORDER_ID);
            transaction.setAmtCredit(TOP_UP_AMOUNT);
            transaction.setAccount(account);

            GeneralDao generalDao = mock(GeneralDao.class);
            when(generalDao.findOneSQLQuery(any(), contains("FROM account_transaction"), any())).thenReturn(transaction);
            when(generalDao.findOneSQLQuery(any(), contains("FROM accounts"), any())).thenReturn(account);
            when(generalDao.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(generalDao.update(any())).thenAnswer(inv -> inv.getArgument(0));

            injectField(service, "generalDao", generalDao);
            injectField(service, "razorpaySecret", SECRET);
            injectField(service, "razorPayKey", "rzp_test_key");
        }

        PaymentRequestDTO callback(String signature, String error) {
            PaymentRequestDTO dto = new PaymentRequestDTO();
            dto.setRazorpay_order_id(ORDER_ID);
            dto.setRazorpay_payment_id(PAYMENT_ID);
            dto.setRazorpay_signature(signature);
            dto.setError(error);
            return dto;
        }
    }

    /** Razorpay's signature: HMAC-SHA256 of "order_id|payment_id" with the key secret, hex-encoded. */
    private static String sign(String orderId, String paymentId, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes("UTF-8"), "HmacSHA256"));
        byte[] hash = mac.doFinal((orderId + "|" + paymentId).getBytes("UTF-8"));
        StringBuilder hex = new StringBuilder(hash.length * 2);
        for (byte b : hash) {
            hex.append(Character.forDigit((b >> 4) & 0xF, 16));
            hex.append(Character.forDigit(b & 0xF, 16));
        }
        return hex.toString();
    }

    private static void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getSuperclass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
