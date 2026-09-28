(function (wp) {
  var el = wp.element.createElement;
  wp.plugins.registerPlugin('graphite-project-sidebar', {
    render: function () {
      return el(wp.editPost.PluginDocumentSettingPanel, { name: 'graphite-project-data', title: 'Graphite project data' },
        el('p', null, 'Edit project facts and relationships in the custom fields panel.'));
    }
  });
})(window.wp);
