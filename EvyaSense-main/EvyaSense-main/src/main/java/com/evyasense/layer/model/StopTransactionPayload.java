package com.evyasense.layer.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;




import lombok.Data;
import java.util.List;

@Data
public class StopTransactionPayload {

    private String idTag;
    private Integer meterStop;
    private String timestamp;
    private Integer transactionId;
    private String reason;

    public String getIdTag() {
		return idTag;
	}

	public void setIdTag(String idTag) {
		this.idTag = idTag;
	}

	public Integer getMeterStop() {
		return meterStop;
	}

	public void setMeterStop(Integer meterStop) {
		this.meterStop = meterStop;
	}

	public String getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}

	public Integer getTransactionId() {
		return transactionId;
	}

	public void setTransactionId(Integer transactionId) {
		this.transactionId = transactionId;
	}

	public String getReason() {
		return reason;
	}

	public void setReason(String reason) {
		this.reason = reason;
	}

	public List<TransactionData> getTransactionData() {
		return transactionData;
	}

	public void setTransactionData(List<TransactionData> transactionData) {
		this.transactionData = transactionData;
	}

	// ✅ Added field
    private List<TransactionData> transactionData;

    @Data
    public static class TransactionData {
        private String timestamp;
        private List<MeterValue> sampledValue;
		public String getTimestamp() {
			return timestamp;
		}
		public void setTimestamp(String timestamp) {
			this.timestamp = timestamp;
		}
		public List<MeterValue> getSampledValue() {
			return sampledValue;
		}
		public void setSampledValue(List<MeterValue> sampledValue) {
			this.sampledValue = sampledValue;
		}
    }

    @Data
    public static class MeterValue {
        private String value;
        private String context;
        private String format;
        private String measurand;
        private String phase;
        private String location;
        private String unit;
		public String getValue() {
			return value;
		}
		public void setValue(String value) {
			this.value = value;
		}
		public String getContext() {
			return context;
		}
		public void setContext(String context) {
			this.context = context;
		}
		public String getFormat() {
			return format;
		}
		public void setFormat(String format) {
			this.format = format;
		}
		public String getMeasurand() {
			return measurand;
		}
		public void setMeasurand(String measurand) {
			this.measurand = measurand;
		}
		public String getPhase() {
			return phase;
		}
		public void setPhase(String phase) {
			this.phase = phase;
		}
		public String getLocation() {
			return location;
		}
		public void setLocation(String location) {
			this.location = location;
		}
		public String getUnit() {
			return unit;
		}
		public void setUnit(String unit) {
			this.unit = unit;
		}
    }
}
