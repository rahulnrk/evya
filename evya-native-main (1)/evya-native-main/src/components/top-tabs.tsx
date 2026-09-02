import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {h} from '../constants/dimensions';
import {adjust} from '../helpers/common-functions';
import {medium} from '../utils/fonts';
import {pallette} from '../utils/pallette';

interface TopTabsProps {
  tabs: string[];
  onTabChange?: (index: number) => void;
}

const TopTabs: React.FC<TopTabsProps> = ({tabs, onTabChange}) => {
  const [activeTab, setActiveTab] = useState(0);

  /**
   * Handle tab press and notify parent component
   */
  const handleTabPress = (index: number): void => {
    setActiveTab(index);
    // Send the index to parent component, not the tab name
    if (onTabChange) {
      onTabChange(index);
    }
  };

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tabWrapper}
          onPress={() => handleTabPress(index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === index && styles.activeTabText,
            ]}
          >
            {tab}
          </Text>
          {activeTab === index && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: pallette.grey,
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: h * 0.012,
  },
  tabText: {
    fontSize: adjust(16),
    fontFamily: medium,
    color: pallette.grey,
  },
  activeTabText: {
    color: pallette.primary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '100%',
    backgroundColor: pallette.primary,
  },
});

export default TopTabs;