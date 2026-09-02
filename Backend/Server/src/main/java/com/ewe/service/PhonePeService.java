package com.ewe.service;

import com.ewe.pojo.PhonePeOrderStatusResponse;
import com.ewe.pojo.PhonePePaymentRequest;
import com.ewe.pojo.PhonePePaymentResponse;

public interface PhonePeService {
    PhonePePaymentResponse createPayment(PhonePePaymentRequest request);
    PhonePeOrderStatusResponse verifyAndUpdateWallet(String merchantOrderId);


}