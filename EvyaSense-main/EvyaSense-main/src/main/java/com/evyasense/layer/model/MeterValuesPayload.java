package com.evyasense.layer.model;



import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;


@Data
public class MeterValuesPayload {
    private Integer connectorId;
    private Integer transactionId;
    private List<MeterValue> meterValue;
    
    public Integer getConnectorId() {
		return connectorId;
	}

	public void setConnectorId(Integer connectorId) {
		this.connectorId = connectorId;
	}

	public Integer getTransactionId() {
		return transactionId;
	}

	public void setTransactionId(Integer transactionId) {
		this.transactionId = transactionId;
	}

	public List<MeterValue> getMeterValue() {
		return meterValue;
	}

	public void setMeterValue(List<MeterValue> meterValue) {
		this.meterValue = meterValue;
	}

	@Data
    public static class MeterValue {
        private String timestamp;
        private List<SampledValue> sampledValue;
		public String getTimestamp() {
			return timestamp;
		}
		public void setTimestamp(String timestamp) {
			this.timestamp = timestamp;
		}
		public List<SampledValue> getSampledValue() {
			return sampledValue;
		}
		public void setSampledValue(List<SampledValue> sampledValue) {
			this.sampledValue = sampledValue;
		}
    }
    
    @Data
    public static class SampledValue {
        private String value;
        private String context;
        private String format;
        private String measurand;
        private String location;
        private String unit;
        private String phase;
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
		public String getPhase() {
			return phase;
		}
		public void setPhase(String phase) {
			this.phase = phase;
		}
        
    }
}
