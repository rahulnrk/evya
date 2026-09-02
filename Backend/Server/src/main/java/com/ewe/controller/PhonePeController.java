package com.ewe.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ewe.pojo.PhonePeOrderStatusResponse;
import com.ewe.pojo.PhonePePaymentRequest;
import com.ewe.pojo.PhonePePaymentResponse;
import com.ewe.service.PhonePeService;

@RestController
@RequestMapping("/api/mobile")
public class PhonePeController {
    private final PhonePeService phonePeService;

    public PhonePeController(PhonePeService phonePeService) {
        this.phonePeService = phonePeService;
    }

  

    @PostMapping("/pay")
    public ResponseEntity<PhonePePaymentResponse> createPayment(
            @RequestBody PhonePePaymentRequest request) {
        return ResponseEntity.ok(phonePeService.createPayment(request));
    }


    @GetMapping("/verify/{merchantOrderId}")
    public ResponseEntity<PhonePeOrderStatusResponse> verifyAndUpdateWallet(
            @PathVariable String merchantOrderId) {
        return ResponseEntity.ok(phonePeService.verifyAndUpdateWallet(merchantOrderId));
    }
}