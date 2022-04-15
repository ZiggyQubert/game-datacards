import { ForkOutlined, HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Badge, Button, Col, Layout, Row, Space, Tooltip, Typography } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import clone from 'just-clone';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import '../App.css';
import { UnitCard } from '../Components/UnitCard';
import { useCardStorage } from '../Hooks/useCardStorage';
import { useFirebase } from '../Hooks/useFirebase';

export const Shared = () => {
  const { Id } = useParams();
  const navigate = useNavigate();

  const { getCategory, likeCategory } = useFirebase();

  const [historyStorage, setHistoryStorage] = useState({ liked: [] });

  const [sharedStorage, setSharedStorage] = useState();

  const { importCategory } = useCardStorage();

  useEffect(() => {
    const localShareStorage = localStorage.getItem('historyStorage');
    if (localShareStorage) {
      setHistoryStorage(JSON.parse(localShareStorage));
    }
  }, []);

  useEffect(() => {
    document.title = `Shared ${sharedStorage?.category?.name || ''} - Game Datacards`;
  }, [sharedStorage]);

  useEffect(() => {
    localStorage.setItem('historyStorage', JSON.stringify(historyStorage));
  }, [historyStorage]);

  useEffect(() => {
    if (Id) {
      getCategory(Id).then((cat) => {
        setSharedStorage(cat);
      });
    }
  }, [Id, getCategory]);

  return (
    <Layout>
      <Header>
        <Row style={{ justifyContent: 'space-between' }}>
          <Col>
            <Link to={'/'}>
              <Typography.Title level={2} style={{ color: 'white', marginBottom: 0, lineHeight: '4rem' }}>
                Game Datacards
              </Typography.Title>
            </Link>
          </Col>
          <Col>
            <Typography.Title level={3} style={{ color: 'white', marginBottom: 0, lineHeight: '4rem' }}>
              {sharedStorage?.category?.name}
            </Typography.Title>
          </Col>
          <Col>
            <Space style={{ marginRight: '16px' }}>
              {/* <Button
                className='button-bar'
                type='ghost'
                shape='circle'
                size='large'
                icon={<ShareAltOutlined style={{ fontSize: '20px' }} />}
              /> */}
              {historyStorage.liked.includes(Id) ? (
                <Badge count={sharedStorage?.likes} offset={[-4, 14]} size='small' color={'blue'} overflowCount={999}>
                  <Tooltip title={'You have already liked this set.'}>
                    <Button
                      className='button-bar'
                      type='text'
                      size='large'
                      disabled={true}
                      icon={<HeartFilled style={{ color: '#40a9ff', cursor: 'cursor' }} />}
                    />
                  </Tooltip>
                </Badge>
              ) : (
                <Badge count={sharedStorage?.likes} offset={[-4, 14]} size='small' color={'blue'} overflowCount={999}>
                  <Button
                    className='button-bar'
                    type='ghost'
                    size='large'
                    icon={<HeartOutlined />}
                    onClick={() => {
                      const newStorage = clone(historyStorage);
                      newStorage.liked.push(Id);
                      setHistoryStorage(newStorage);
                      setSharedStorage((prev) => {
                        return { ...prev, likes: prev.likes + 1 };
                      });
                      likeCategory(Id);
                    }}
                  />
                </Badge>
              )}
            </Space>
            <Space>
              {/* <Button className='button-bar' type='ghost' size='large' icon={<CodeJson />}>
                Embed
              </Button> */}
              <Button
                className='button-bar'
                type='ghost'
                size='large'
                icon={<ForkOutlined />}
                onClick={() => {
                  const cloneCategory = {
                    ...sharedStorage.category,
                    name: `Imported ${sharedStorage.category.name}`,
                    uuid: uuidv4(),
                    cards: sharedStorage.category.cards.map((card) => {
                      return { ...card, uuid: uuidv4() };
                    }),
                  };

                  importCategory(cloneCategory);
                  navigate('/');
                }}
              >
                Clone
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>
      <Content>
        <div className='flex' style={{ pageBreakAfter: 'always', gridTemplateColumns: `1fr 1fr 1fr` }}>
          {sharedStorage?.category?.cards?.map((card, index) => {
            return <UnitCard unit={card} key={`${card.name}-${index}`} />;
          })}
        </div>
      </Content>
    </Layout>
  );
};
