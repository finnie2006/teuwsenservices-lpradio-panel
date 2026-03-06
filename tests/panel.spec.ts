import { test, expect } from '@grafana/plugin-e2e';

test('should display LP radio widget in panel edit', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  await gotoPanelEditPage({ dashboard, id: '2' });
  await expect(page.getByTestId('lp-disc')).toBeVisible();
});

test('should render station info and disc when visualization is selected', async ({
  panelEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Radio-Panel');
  await expect(page.getByTestId('lp-disc')).toBeVisible();
  await expect(page.getByTestId('track-info')).toBeVisible();
});

test('should show display options in the options pane', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });

  await expect(panelEditPage.getByGrafanaSelector({ selector: 'Options group Display' })).toBeVisible();
  await expect(page.getByText('Loading text')).toBeVisible();
});
