package com.ewe.form;

import java.util.List;

import org.apache.poi.ss.formula.functions.T;

public class DataResponse<T>  {
	
	 private String type;          // "data"
	    private String component;     // "whitelabel", "franchise", "evuser"
	    private String subComponent;  //for info pages
	    public String getSubComponent() {
			return subComponent;
		}
		public void setSubComponent(String subComponent) {
			this.subComponent = subComponent;
		}
		private int count;
	    private String listRoute;
	    private List<T> items;
		public String getType() {
			return type;
		}
		public void setType(String type) {
			this.type = type;
		}
		public String getComponent() {
			return component;
		}
		public void setComponent(String component) {
			this.component = component;
		}
		public int getCount() {
			return count;
		}
		public void setCount(int count) {
			this.count = count;
		}
		public String getListRoute() {
			return listRoute;
		}
		public void setListRoute(String listRoute) {
			this.listRoute = listRoute;
		}
		public List<T> getItems() {
			return items;
		}
		public void setItems(List<T> items) {
			this.items = items;
		}

}
