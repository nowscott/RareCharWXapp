Component({
  properties: {
    selected: {
      type: Number,
      value: 0
    }
  },

  methods: {
    switchTab(e) {
      const dataset = e.currentTarget.dataset;
      const url = dataset.url;
      const index = dataset.index;
      
      if (this.data.selected !== index) {
        wx.switchTab({ url });
      }
    }
  }
}); 