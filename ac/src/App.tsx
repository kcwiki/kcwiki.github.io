import React from 'react'

import { Table, Input, Button, Layout, Menu, Icon, List, Collapse } from 'antd'

import './App.css'
import data from './data'
import pop from './popularity'

const { Header, Content } = Layout

const sorter = (a: any, b: any) => a.toString().localeCompare(b.toString())

const column = (title: string, render?: any, props?: any) => ({
  title,
  align: 'center' as 'center',
  dataIndex: title.toLowerCase(),
  key: title.toLowerCase(),
  sorter: (a: any, b: any) => (title === 'Source' ? sorter(a.source.type, b.source.type) : sorter(a[title.toLowerCase()], b[title.toLowerCase()])),
  render,
  ...props,
})

const wikiLink = (ship: string) => (
  <a href={`https://kancolle.fandom.com/wiki/${ship.replace(/\s/g, '_')}`} target="_blank" rel="noopener noreferrer">
    {ship}
  </a>
)

class MyTable extends React.Component {
  state = { searchText: '', n: data.length }

  searchInput: Input | null = null

  getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node
          }}
          placeholder={`Search ${dataIndex.replace('.', ' ')}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm)}
          icon="search"
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
          Reset
        </Button>
      </div>
    ),
    filterIcon: (filtered: any) => <Icon type="search" style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value: any, record: any) => {
      const indexes = dataIndex.split('.')
      let e = record
      for (const index of indexes) {
        e = e[index]
      }
      return e
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase())
    },
    onFilterDropdownVisibleChange: (visible: any) => {
      if (visible) {
        setTimeout(() => this.searchInput && this.searchInput.select())
      }
    },
  })

  handleSearch = (selectedKeys: any, confirm: any) => {
    confirm()
    this.setState({ searchText: selectedKeys[0] })
  }

  handleReset = (clearFilters: any) => {
    clearFilters()
    this.setState({ searchText: '' })
  }

  onTableChange = (_: any, __: any, ___: any, data: any) => {
    if (data && data.currentDataSource && data.currentDataSource.length) {
      this.setState({ ...this.state, n: data.currentDataSource.length })
    }
  }

  render() {
    const columns = [
      column('Rarity', (n: number) => ['★', '★★', '★★★'][n - 1], {
        filters: [{ text: '★', value: 1 }, { text: '★★', value: 2 }, { text: '★★★', value: 3 }],
        onFilter: (value: any, record: any) => record.rarity === value,
      }),
      column('Ship', (ships: string[]) => ships.map((e, i) => <div key={i}>{wikiLink(e)}</div>), this.getColumnSearchProps('ship')),
      column('Name', null, this.getColumnSearchProps('name')),
      column(
        'Source',
        (e: any) => (
          <div>
            <a href={e.url} style={{ color: e.status && e.status !== 200 ? 'red' : undefined }}>
              {e.type}
            </a>
          </div>
        ),
        this.getColumnSearchProps('source.type'),
      ),
      column('Image', (image: string) => (
        <a href={image} target="_blank" rel="noopener noreferrer">
          <img src={image} alt="" style={{ width: '200px' }} />
        </a>
      )),
    ]
    return (
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="middle"
        onChange={this.onTableChange as any}
        title={() => (
          <>
            <div style={{ textAlign: 'left', fontSize: '1.5em', float: 'left' }}>#{this.state.n}</div>
            <div style={{ textAlign: 'right' }}>
              <Button
                icon="download"
                href="https://raw.githubusercontent.com/kcwiki/kcwiki.github.io/develop/ac/data.csv"
                target="_blank"
                rel="noopener noreferrer"
              >
                CSV
              </Button>
            </div>
          </>
        )}
      />
    )
  }
}

const App = () => (
  <Layout style={{ minWidth: 800 }}>
    <Header>
      <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']} style={{ lineHeight: '64px' }}>
        <Menu.Item key="1">
          <a href="https://amusementclub.xyz/">Amusement Club KanColle Cards</a>
        </Menu.Item>
      </Menu>
    </Header>
    <Content style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ background: '#fff', padding: 20, minWidth: 600, maxWidth: 800, margin: '0 auto' }}>
        <Collapse>
          <Collapse.Panel header="Popularity" key="1">
            <List
              size="small"
              grid={{ column: 4 }}
              dataSource={pop}
              renderItem={({ ship, count }: any) => (
                <List.Item>
                  {wikiLink(ship)}: {count}
                </List.Item>
              )}
              style={{ textAlign: 'left' }}
            />
          </Collapse.Panel>
        </Collapse>
        <MyTable />
      </div>
    </Content>
  </Layout>
)

export default App
