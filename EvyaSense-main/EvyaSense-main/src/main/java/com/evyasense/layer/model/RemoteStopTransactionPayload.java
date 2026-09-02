package com.evyasense.layer.model;



import lombok.Data;

@Data
public class RemoteStopTransactionPayload {

    private Integer transactionId;

	public Integer getTransactionId() {
		return transactionId;
	}

	public void setTransactionId(Integer transactionId) {
		this.transactionId = transactionId;
	}
}
