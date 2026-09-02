package com.ewe.serviceImpl;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

import com.ewe.config.PhonePeConfig;
import com.ewe.dao.GeneralDao;
import com.ewe.pojo.AccountTransactions;
import com.ewe.pojo.Accounts;
import com.ewe.pojo.PhonePeOrderStatusResponse;
import com.ewe.pojo.PhonePePaymentRequest;
import com.ewe.pojo.PhonePePaymentResponse;
import com.ewe.pojo.PhonePeTokenResponse;
import com.ewe.pojo.User;
import com.ewe.service.PhonePeService;

@Service
public class PhonePeServiceImpl implements PhonePeService {

    private final PhonePeConfig phonePeConfig;
    private final RestTemplate restTemplate;
    private final GeneralDao generalDao;

    @PersistenceContext
    private EntityManager entityManager;

    public PhonePeServiceImpl(PhonePeConfig phonePeConfig,
                               RestTemplate restTemplate,
                               GeneralDao generalDao) {
        this.phonePeConfig = phonePeConfig;
        this.restTemplate = restTemplate;
        this.generalDao = generalDao;
    }
    private PhonePeTokenResponse generateToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "client_id=" + phonePeConfig.getClientId()
                + "&client_version=" + phonePeConfig.getClientVersion()
                + "&client_secret=" + phonePeConfig.getClientSecret()
                + "&grant_type=client_credentials";

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<PhonePeTokenResponse> response = restTemplate.exchange(
                phonePeConfig.getAuthUrl(),
                HttpMethod.POST,
                entity,
                PhonePeTokenResponse.class
        );
        System.out.println("Token Success");
        return response.getBody();
    }
  
    @Override
    public PhonePePaymentResponse createPayment(PhonePePaymentRequest request) {

        PhonePeTokenResponse tokenResponse = generateToken();
        String token = tokenResponse.getAccessToken();

        // BUG-8: server-issued merchant order id (client must not invent it)
        String merchantOrderId = request.getMerchantOrderId();
        if (merchantOrderId == null || merchantOrderId.trim().isEmpty()
                || merchantOrderId.startsWith("TX")) {
            merchantOrderId = "PP" + java.util.UUID.randomUUID().toString().replace("-", "");
            request.setMerchantOrderId(merchantOrderId);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "O-Bearer " + token);

        Map<String, Object> paymentFlow = new HashMap<>();
        paymentFlow.put("type", "PG_CHECKOUT");
        paymentFlow.put("message", "Payment for order " + merchantOrderId);

        Map<String, String> merchantUrls = new HashMap<>();
        merchantUrls.put("redirectUrl", phonePeConfig.getRedirectUrl());
        paymentFlow.put("merchantUrls", merchantUrls);

        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("merchantOrderId",     merchantOrderId);
        bodyMap.put("amount",              request.getAmount());
        bodyMap.put("expireAfter",         request.getExpireAfter() != null ? request.getExpireAfter() : 1200);
        bodyMap.put("paymentFlow",         paymentFlow);
        bodyMap.put("disablePaymentRetry", false);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(bodyMap, headers);

        ResponseEntity<PhonePePaymentResponse> response = restTemplate.exchange(
                phonePeConfig.getPayUrl(),
                HttpMethod.POST,
                entity,
                PhonePePaymentResponse.class
        );

        PhonePePaymentResponse phonePeResponse = response.getBody();
        if (phonePeResponse != null && (phonePeResponse.getOrderId() == null || phonePeResponse.getOrderId().isEmpty())) {
            // Ensure client always receives the server-issued id
            phonePeResponse.setOrderId(merchantOrderId);
        }

        try {
            if (request.getUserId() != null && phonePeResponse != null) {
                // SEC-4b: parameterized — never concatenate userId / order ids into SQL
                User user = findUserById(request.getUserId());

                if (user == null) {
                    System.out.println("User not found: " + request.getUserId());
                } else {
                    Accounts account = findAccountByUserId(user.getId());

                    if (account == null) {
                        System.out.println("Account not found for user: " + user.getId());
                    } else {
                        AccountTransactions transaction = new AccountTransactions();
                        transaction.setTransactionId(phonePeResponse.getOrderId());
                        transaction.setAmtCredit(0);
                        transaction.setAmtDebit(0);
                        transaction.setCurrentBalance(account.getAccountBalance());
                        transaction.setStatus("PENDING");
                        transaction.setComment("PhonePe payment initiated - Rs." + (request.getAmount() / 100));
                        transaction.setAccount(account);
                        transaction.setCreationDate(new Date());
                        generalDao.save(transaction);
                        System.out.println("PENDING transaction saved: " + request.getMerchantOrderId());
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("Warning - Could not save pending transaction: " + e.getMessage());
            e.printStackTrace();
        }

        return phonePeResponse;
    }

   

    @Override
    @Transactional
    public PhonePeOrderStatusResponse verifyAndUpdateWallet(String merchantOrderId) {

        // ✅ Inlined token generation + status check (no separate method needed)
        PhonePeTokenResponse tokenResponse = generateToken();
        String token = tokenResponse.getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "O-Bearer " + token);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = phonePeConfig.getStatusUrl() + "/" + merchantOrderId + "/status?details=false";
        System.out.println("Checking status: " + url);

        PhonePeOrderStatusResponse statusResponse = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                PhonePeOrderStatusResponse.class
        ).getBody();

        String state = statusResponse.getState();
        System.out.println("Payment state: " + state);

        try {
            // SEC-4b: order id is user/provider-influenced — always bind as parameter
            String orderId = statusResponse.getOrderId();
            if (orderId == null || orderId.isEmpty()) {
                orderId = merchantOrderId;
            }
            AccountTransactions transaction = findPendingTxnByOrderId(orderId);
            System.out.println("Transaction found: " + (transaction != null));

            if (transaction == null) {
                System.out.println("No PENDING transaction found: " + merchantOrderId);
                return statusResponse;
            }

            Accounts account = findAccountByOrderId(orderId);

            System.out.println("Account found: " + (account != null ? account.getId() : "NULL"));
            System.out.println("Current balance: " + (account != null ? account.getAccountBalance() : "NULL"));

            if (account == null) {
                System.out.println("Account not found: " + merchantOrderId);
                return statusResponse;
            }

            if ("COMPLETED".equals(state)) {

                double amountInRupees = statusResponse.getAmount() / 100.0;

                // SEC-6: claim PENDING row first (idempotent), then atomic credit
                Query markDone = entityManager.createNativeQuery(
                        "UPDATE account_transaction SET status = 'COMPLETING', amtCredit = :amt, amtDebit = 0, "
                                + "comment = :cmt WHERE id = :txnId AND status = 'PENDING'");
                markDone.setParameter("amt", amountInRupees);
                markDone.setParameter("cmt", "PhonePe payment successful | TransactionId " + statusResponse.getOrderId());
                markDone.setParameter("txnId", transaction.getId());
                int marked = markDone.executeUpdate();
                if (marked == 0) {
                    System.out.println("Idempotent skip: transaction already finalized for " + merchantOrderId);
                } else {
                    Query credit = entityManager.createNativeQuery(
                            "UPDATE accounts SET accountBalance = accountBalance + :amt WHERE id = :id");
                    credit.setParameter("amt", amountInRupees);
                    credit.setParameter("id", account.getId());
                    credit.executeUpdate();

                    Query finalize = entityManager.createNativeQuery(
                            "UPDATE account_transaction SET status = 'COMPLETED', "
                                    + "currentBalance = (SELECT accountBalance FROM accounts WHERE id = :accId) "
                                    + "WHERE id = :txnId");
                    finalize.setParameter("accId", account.getId());
                    finalize.setParameter("txnId", transaction.getId());
                    finalize.executeUpdate();
                    System.out.println("Atomic credit applied amount=Rs." + amountInRupees);
                }

            } else if ("FAILED".equals(state)) {

                transaction.setStatus("FAILED");
                transaction.setComment("PhonePe payment failed");
                generalDao.savOrupdate(transaction);
                System.out.println("Transaction FAILED!");
            }

        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
        }

        return statusResponse;
    }

    // --- SEC-4b parameterized lookups (payment path) ---

    private User findUserById(Long userId) {
        if (userId == null) {
            return null;
        }
        try {
            org.hibernate.Session session = entityManager.unwrap(org.hibernate.Session.class);
            return (User) session.createSQLQuery("SELECT * FROM users WHERE id = :id")
                    .addEntity(User.class)
                    .setParameter("id", userId)
                    .setMaxResults(1)
                    .uniqueResult();
        } catch (Exception e) {
            System.out.println("findUserById error: " + e.getMessage());
            return null;
        }
    }

    private Accounts findAccountByUserId(Long userId) {
        if (userId == null) {
            return null;
        }
        try {
            org.hibernate.Session session = entityManager.unwrap(org.hibernate.Session.class);
            return (Accounts) session
                    .createSQLQuery("SELECT TOP 1 * FROM accounts WHERE user_id = :uid ORDER BY id ASC")
                    .addEntity(Accounts.class)
                    .setParameter("uid", userId)
                    .setMaxResults(1)
                    .uniqueResult();
        } catch (Exception e) {
            System.out.println("findAccountByUserId error: " + e.getMessage());
            return null;
        }
    }

    private AccountTransactions findPendingTxnByOrderId(String orderId) {
        if (orderId == null || orderId.isEmpty()) {
            return null;
        }
        try {
            org.hibernate.Session session = entityManager.unwrap(org.hibernate.Session.class);
            return (AccountTransactions) session.createSQLQuery(
                    "SELECT TOP 1 * FROM account_transaction WHERE transactionId = :tid "
                            + "AND status = 'PENDING' ORDER BY id ASC")
                    .addEntity(AccountTransactions.class)
                    .setParameter("tid", orderId)
                    .setMaxResults(1)
                    .uniqueResult();
        } catch (Exception e) {
            System.out.println("findPendingTxnByOrderId error: " + e.getMessage());
            return null;
        }
    }

    private Accounts findAccountByOrderId(String orderId) {
        if (orderId == null || orderId.isEmpty()) {
            return null;
        }
        try {
            org.hibernate.Session session = entityManager.unwrap(org.hibernate.Session.class);
            return (Accounts) session.createSQLQuery(
                    "SELECT TOP 1 * FROM accounts WHERE id = "
                            + "(SELECT TOP 1 account_id FROM account_transaction "
                            + "WHERE transactionId = :tid ORDER BY id ASC)")
                    .addEntity(Accounts.class)
                    .setParameter("tid", orderId)
                    .setMaxResults(1)
                    .uniqueResult();
        } catch (Exception e) {
            System.out.println("findAccountByOrderId error: " + e.getMessage());
            return null;
        }
    }
}