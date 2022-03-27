import {
  AppstoreAddOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  PrinterOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Collapse,
  Input,
  Layout,
  List,
  message,
  Modal,
  Row,
  Select,
  Tooltip,
  Tree,
  Typography,
} from 'antd';
import 'antd/dist/antd.min.css';
import { useEffect, useState } from 'react';
import NewWindow from 'react-new-window';
import './App.css';
import { UnitCard } from './Pages/UnitCard';
import { UnitCardEditor } from './Pages/UnitCardEditor';
import gtag from 'ga-gtag';

const { Header, Content } = Layout;
const { Option } = Select;
const { confirm } = Modal;
const { Panel } = Collapse;

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

const readCsv = async (file) => {
  if (!file) {
    return;
  }

  return fetch(file)
    .then((response) => response.text())
    .then((text) => JSON.parse(text));
};

const generateTree = (data, selected) => {
  const temp = [
    {
      title: 'Page 1',
      key: 'page-0',
      children: [],
      icon: <FileOutlined />,
    },
  ];

  if (!data) {
    return temp;
  }
  data.forEach((card, index) => {
    temp[0].children.push({
      title: card.name,
      key: `${card.id}-${index}`,
      icon: <ProfileOutlined />,
    });
  });
  return temp;
};

function App() {
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [factions, setFactions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoading, setLoading] = useState(false);

  const [showPrint, setShowPrint] = useState(false);

  const [searchText, setSearchText] = useState(undefined);

  const [selectedTreeKey, setSelectedTreeKey] = useState(null);

  const [cards, setCards] = useState(() => {
    const lsCards = localStorage.getItem('cards');
    return lsCards ? JSON.parse(lsCards) : [];
  });

  useEffect(() => {
    async function fetchData() {
      const dataDatasheetAbilities = await readCsv(
        'https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Datasheets_abilities.json'
      );
      const dataAbilities = await readCsv(
        'https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Abilities.json'
      );
      const dataDatasheetWargear = await readCsv(
        'https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Datasheets_wargear.json'
      );
      const dataWargearList = await readCsv(
        'https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Wargear_list.json'
      );
      const dataWargear = await readCsv(
        'https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Wargear.json'
      );
      const dataModels = await readCsv(
        'https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Datasheets_models.json'
      );
      const dataKeywords = await readCsv(
        'https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Datasheets_keywords.json'
      );
      const dataFactions = await readCsv(
        'https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Factions.json'
      );
      const sheets = await readCsv('https://raw.githubusercontent.com/ronplanken/40k-jsons/main/json/Datasheets.json');

      const mappedSheets = sheets.map((row) => {
        row['keywords'] = [
          ...new Map(
            dataKeywords
              .filter((keyword) => keyword.datasheet_id === row.id)
              .map((model) => {
                return { ...model, active: true };
              })
              .map((item) => [item['keyword'], item])
          ).values(),
        ];
        row['datasheet'] = dataModels
          .filter((model) => model.datasheet_id === row.id)
          .filter(onlyUnique)
          .map((model, index) => {
            return { ...model, active: index === 0 ? true : false };
          });
        const linkedWargear = [
          ...new Map(
            dataDatasheetWargear
              .filter((wargear) => wargear.datasheet_id === row.id && wargear.is_index_wargear === 'false')
              .map((item) => [item['wargear_id'], item])
          ).values(),
        ];

        row['wargear'] = [];
        linkedWargear.forEach((wargear, index) => {
          row['wargear'][index] = dataWargear.find((gear) => gear.id === wargear.wargear_id);
          if (row['wargear'][index]) {
            row['wargear'][index]['active'] = index === 0 ? true : false;
            row['wargear'][index]['profiles'] = dataWargearList.filter(
              (wargearList) => wargearList.wargear_id === wargear.wargear_id
            );
          }
        });
        const linkedAbilities = dataDatasheetAbilities.filter((ability) => ability.datasheet_id === row.id);
        row['abilities'] = [];
        linkedAbilities.forEach((ability, index) => {
          row['abilities'].push(dataAbilities.find((abilityInfo) => abilityInfo.id === ability.ability_id));
        });
        row['abilities'] = row['abilities'].map((ability, index) => {
          return { ...ability, showDescription: false, showAbility: index === 0 ? true : false };
        });
        return row;
      });
      mappedSheets.shift();
      dataFactions.map((faction) => {
        faction['datasheets'] = mappedSheets
          .filter((datasheet) => datasheet.faction_id === faction.id)
          .sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        return faction;
      });

      setFactions(dataFactions);
      setLoading(false);
    }
    setLoading(true);
    fetchData();
  }, []);

  return (
    <Layout>
      <Header>
        <Row style={{ justifyContent: 'space-between' }}>
          <Col>
            <Typography.Title level={2} style={{ color: 'white', marginBottom: 0, marginTop: '8px' }}>
              Game Datacards
            </Typography.Title>
          </Col>
          <Col>
            <Button
              size='large'
              shape='circle'
              type={'text'}
              icon={<QuestionCircleOutlined />}
              style={{ color: 'white' }}
              onClick={() => {
                gtag('event', 'Show help', {
                  event_category: 'Actions',
                });

                Modal.info({
                  title: 'Game Datacards',
                  width: 850,
                  content: (
                    <div>
                      <p>
                        The Game Datacards website is a tool to help Tabletop Wargaming players around the world create
                        their own custom datacards for printing.
                      </p>
                      <b>Thank you to:</b>
                      <ul>
                        <li>
                          <p>External data sources are powered by Wahapedia.</p>
                        </li>
                        <li>
                          <p>
                            Card design &amp; icons are created by Locequen. (
                            <Typography.Link link='https://github.com/Locequen/40k-Data-Card'>
                              Locequen / 40k-Data-Card on Github
                            </Typography.Link>)
                          </p>
                        </li>
                      </ul>

                      <b>Planned features:</b>
                      <ul>
                        <li>
                          <p>More external datasources (OPR and more games)</p>
                        </li>
                        <li>
                          <p>Ability to export / import cards.</p>
                        </li>
                        <li>
                          <p>Add more pages to the card builder.</p>
                        </li>
                        <li>
                          <p>Reorder cards saved in the card builder.</p>
                        </li>
                        <li>
                          <p>
                            After an selected card has been changed, make sure to let the user know they have to press
                            the "update card" button.
                          </p>
                        </li>
                      </ul>

                      <Collapse defaultActiveKey={'0.3.0'}>
                        <Panel header={'Version 0.3.1'} key={'0.3.1'}>
                          <b>Changelog</b>
                          <ul>
                            <li>Added a search option to the unit list.</li>
                            <li>Units are now sorted by alphabetical order.</li>
                            <li>Made more fields on the card truncate or have a maximum shown length.</li>
                            <li><b>0.3.1: </b>Removed html tags from descriptions and abilities.</li>
                          </ul>
                        </Panel>
                        <Panel header={'Version 0.2.0'} key={'0.2.0'}>
                          <b>Changelog</b>
                          <ul>
                            <li>Updated the Page menu to use an icon bar instead of text buttons.</li>
                            <li>Having a "broken" card in your page will now allow you to select and delete it.</li>
                            <li>
                              The default selection of external data set cards now includes less data visible by
                              Default.
                            </li>
                          </ul>
                        </Panel>
                      </Collapse>
                    </div>
                  ),
                  onOk() {},
                });
              }}
            />
          </Col>
        </Row>
      </Header>
      <Content>
        <Row>
          <Col span={6}>
            <Row>
              <Col span={24}>
                <Row>
                  <Col
                    span={4}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'start',
                      background: 'white',
                      borderBottom: '1px solid #E5E5E5',
                    }}
                  >
                    <Tooltip title={'Print cards'}>
                      <Button
                        type={'text'}
                        shape={'circle'}
                        onClick={() => {
                          gtag('event', 'Print', {
                            event_category: 'Saved Cards',
                            value: cards.length,
                          });
                          setShowPrint(true);
                        }}
                        icon={<PrinterOutlined />}
                      />
                    </Tooltip>
                  </Col>
                  <Col
                    span={20}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'end',
                      background: 'white',
                      borderBottom: '1px solid #E5E5E5',
                    }}
                  >
                    {selectedTreeKey && (
                      <>
                        <Tooltip title={'Update selected card'}>
                          <Button
                            icon={<SaveOutlined />}
                            type={'text'}
                            shape={'circle'}
                            onClick={() => {
                              setCards((currentCards) => {
                                const newCards = [...currentCards];
                                newCards[selectedTreeKey.split('-')[1]] = selectedCard;
                                localStorage.setItem('cards', JSON.stringify(newCards));
                                return newCards;
                              });
                              gtag('event', 'Update', {
                                event_category: 'Saved Cards',
                                value: cards.length,
                              });
                              message.success('Card has been updated');
                            }}
                          ></Button>
                        </Tooltip>
                        <Tooltip title={'Remove selected card'}>
                          <Button
                            icon={<DeleteOutlined />}
                            type={'text'}
                            shape={'circle'}
                            onClick={() => {
                              gtag('event', 'Delete', {
                                event_category: 'Saved Cards',
                                value: cards.length,
                              });
                              confirm({
                                title: 'Are you sure you want to delete this card?',
                                icon: <ExclamationCircleOutlined />,
                                okText: 'Yes',
                                okType: 'danger',
                                cancelText: 'No',
                                onOk: () =>
                                  setCards((currentCards) => {
                                    const newCards = [...currentCards];
                                    newCards.splice(selectedTreeKey.split('-')[1], 1);
                                    localStorage.setItem('cards', JSON.stringify(newCards));
                                    setSelectedCard(null);
                                    setSelectedTreeKey(null);
                                    return newCards;
                                  }),
                              });
                            }}
                          />
                        </Tooltip>
                      </>
                    )}
                    {selectedCard && (
                      <Tooltip title='Add card to page'>
                        <Button
                          icon={<AppstoreAddOutlined />}
                          type={'text'}
                          shape={'circle'}
                          onClick={() => {
                            setCards((currentCards) => {
                              gtag('event', 'Added', {
                                event_category: 'Saved Cards',
                                value: cards.length,
                              });
                              if (!selectedCard) {
                                return;
                              }

                              const newCards = [...currentCards, { ...selectedCard, isCustom: true }];
                              localStorage.setItem('cards', JSON.stringify(newCards));
                              setSelectedTreeKey(`${selectedCard.id}-${currentCards.length}`);
                              return newCards;
                            });
                          }}
                        />
                      </Tooltip>
                    )}
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Tree
                      style={{ height: '300px', overflow: 'auto' }}
                      treeData={generateTree(cards, selectedTreeKey)}
                      selectedKeys={[selectedTreeKey]}
                      defaultExpandAll={true}
                      showIcon={true}
                      blockNode
                      onSelect={(selectedKeys, info) => {
                        if (selectedKeys.length === 0 && selectedTreeKey.includes('page')) {
                          setSelectedTreeKey(null);
                          return;
                        }
                        if (selectedKeys.length === 0 && !selectedTreeKey.includes('page')) {
                          setSelectedCard(null);
                          setSelectedTreeKey(null);
                          return;
                        }
                        if (selectedKeys[0].includes('page')) {
                          return;
                        }
                        setSelectedTreeKey(selectedKeys[0]);

                        if (!selectedKeys[0].includes('undefined')) {
                          const foundCard = cards[selectedKeys[0].split('-')[1]];
                          setSelectedCard(foundCard);
                        }
                      }}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <List
                  bordered
                  size='small'
                  loading={isLoading}
                  dataSource={
                    searchText
                      ? selectedFaction?.datasheets.filter((sheet) =>
                          sheet.name.toLowerCase().includes(searchText.toLowerCase())
                        )
                      : selectedFaction?.datasheets
                  }
                  style={{ overflowY: 'auto', height: 'calc(100vh - 398px)' }}
                  locale={{ emptyText: selectedFaction ? 'No datasheets found' : 'No faction selected' }}
                  header={
                    <>
                      <Row style={{ marginBottom: '4px' }}>
                        <Col span={24}>
                          <Select
                            loading={isLoading}
                            style={{ width: '100%' }}
                            onChange={(value) => {
                              gtag('event', 'Faction', {
                                event_category: 'Sources',
                                value: value,
                              });
                              setSelectedFaction(factions.find((faction) => faction.id === value));
                            }}
                            placeholder='Select a faction'
                          >
                            {factions.map((faction, index) => (
                              <Option value={faction.id} key={`${faction.id}-${index}`}>
                                {faction.name}
                              </Option>
                            ))}
                          </Select>
                        </Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                          <Input.Search
                            placeholder={'Search'}
                            onSearch={(value) => {
                              if (value.length > 0) {
                                setSearchText(value);
                              } else {
                                setSearchText(undefined);
                              }
                            }}
                            allowClear={true}
                          />
                        </Col>
                      </Row>
                    </>
                  }
                  renderItem={(card) => (
                    <List.Item
                      key={`list-${card.id}`}
                      onClick={() => {
                        gtag('event', 'Unit', {
                          event_category: 'Sources',
                          value: card.name,
                        });
                        setSelectedCard(card);
                        setSelectedTreeKey(null);
                      }}
                      className={`list-item ${
                        selectedCard && !selectedCard.isCustom && selectedCard.id === card.id ? 'selected' : ''
                      }`}
                    >
                      {card.name}
                    </List.Item>
                  )}
                />
              </Col>
            </Row>
          </Col>
          <Col span={9} style={{ display: 'flex', flexDirection: 'column', justifyContent: ' space-between' }}>
            <Row style={{ overflow: 'hidden' }}>
              {selectedCard && (
                <Col span={24}>
                  <UnitCard unit={selectedCard} />
                </Col>
              )}
            </Row>
          </Col>
          {selectedCard && (
            <Col span={9} style={{ overflowY: 'auto', height: 'calc(100vh - 64px)' }}>
              <UnitCardEditor selectedCard={selectedCard} setSelectedCard={setSelectedCard} />
            </Col>
          )}
        </Row>
      </Content>
      {showPrint && (
        <NewWindow onUnload={() => setShowPrint(false)} center='screen' title='Datacards'>
          <div className='flex'>
            {cards.map((card) => {
              return <UnitCard unit={card} key={card.id} />;
            })}
          </div>
        </NewWindow>
      )}
    </Layout>
  );
}

export default App;
