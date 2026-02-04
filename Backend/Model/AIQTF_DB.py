import sqlalchemy as sql
from datetime import datetime

DB_URL = "postgresql+psycopg2://postgres:admin@localhost:5432/ai_testing_framework"

engine = sql.create_engine(DB_URL)

connection = engine.connect()

metadata = sql.MetaData()

scenario_table = sql.Table(
    "scenarios",
    metadata,
    sql.Column("id", sql.Integer, primary_key = True, autoincrement=True),
    sql.Column("name", sql.String, nullable = False),
    sql.Column("description", sql.String, nullable = False),
    sql.Column("agent_name", sql.String, nullable = False),
    sql.Column("agent_endpoint", sql.String, nullable = False),
    sql.Column("agent_model", sql.String, nullable = False),
    sql.Column("created_at", sql.DateTime, default=datetime.utcnow),
    sql.Column("tags", sql.ARRAY(sql.String), nullable=True),
    sql.Column("benchmark", sql.ARRAY(sql.Double), nullable=True),
    sql.Column("dimensions", sql.ARRAY(sql.String), nullable=True),
    sql.Column("analysis_score", sql.ARRAY(sql.Double), nullable=True),
    sql.Column("overall_score", sql.Double, nullable=True)
)
    
def insert_scenario(name, description, agent_name, agent_endpoint, agent_model, tags=None, benchmark=None, dimensions=None, analysis_score=None, overall_score=None):
    metadata.create_all(engine)
    
    resp = insert_query = scenario_table.insert().values(
        name=name,
        description=description,
        agent_name=agent_name,
        agent_endpoint=agent_endpoint,
        agent_model=agent_model,
        tags=tags,
        benchmark = benchmark,
        dimensions =  dimensions,
        analysis_score = analysis_score,
        overall_score=overall_score
        
    ).returning(scenario_table.c.id)
    res = connection.execute(insert_query)
    scenario_id = res.scalar() 
    connection.commit()
    return scenario_id
    
    
def fetch_all_scenarios():
    metadata.create_all(engine)
    select_query = sql.select(scenario_table)
    result = connection.execute(select_query)
    return result.fetchall()

def fetch_scenario_by_id(scenario_id, scenario_name=None):
    metadata.create_all(engine)
    if scenario_name:
        select_query = sql.select(scenario_table).where(
            sql.and_(
                scenario_table.c.id == scenario_id,
                scenario_table.c.name == scenario_name
            )
        )
    else:
        select_query = scenario_table.select(scenario_table).where(scenario_table.c.id == scenario_id)
    
    result = connection.execute(select_query)
    return result.fetchone()

def fetch_scenario_by_name(scenario_name):
    metadata.create_all(engine)
    select_query = sql.select(scenario_table).where(
            scenario_table.c.name == scenario_name      
        )
    result = connection.execute(select_query)
    return result.fetchone()


test_suit_table = sql.Table(
    "test_suits",
    metadata,
    sql.Column("id", sql.Integer, primary_key = True, autoincrement=True),
    sql.Column("scenario_id", sql.Integer, sql.ForeignKey("scenarios.id"), nullable = False),
    sql.Column("name", sql.String, nullable = False),
    sql.Column("description", sql.String, nullable = False),
    sql.Column("jira_link", sql.String, nullable = True),
    sql.Column("test_dimensions", sql.ARRAY(sql.String), nullable = True),
    sql.Column("created_at", sql.DateTime, default=datetime.utcnow),
    sql.Column("selected_test_cases", sql.ARRAY(sql.String), nullable = True),
    sql.Column("type", sql.Enum("Automated", "Manual", name="test_type"), nullable = False)
)

def insert_test_suit(scenario_id, name, description, jira_link=None, test_dimensions=None, selected_test_cases=None, type="Automated"):
    metadata.create_all(engine)
    
    insert_query = test_suit_table.insert().values(
        scenario_id=scenario_id,
        name=name,
        description=description,
        jira_link=jira_link,
        test_dimensions=test_dimensions,
        selected_test_cases=selected_test_cases,
        type=type
    )
    res = connection.execute(insert_query)
    connection.commit()
    
def fetch_test_suits_by_scenario(scenario_id):
    metadata.create_all(engine)
    select_query = sql.select().where(test_suit_table.c.scenario_id == scenario_id)
    result = connection.execute(select_query)
    return result.fetchall()

def fetch_test_suit_by_id(test_suit_id):
    metadata.create_all(engine)
    select_query = sql.select().where(test_suit_table.c.id == test_suit_id)
    result = connection.execute(select_query)
    return result.fetchone()

def delete_test_suit(id):
    metadata.create_all(engine)
    delete_query = test_suit_table.delete().where(test_suit_table.c.id == id)
    res = connection.execute(delete_query)
    connection.commit()

def fetch_all_test_suits():
    metadata.create_all(engine)
    select_query = sql.select(test_suit_table)
    result = connection.execute(select_query)
    return result.fetchall()

agent_list_table = sql.Table(
    "agent_model",
    metadata,
    sql.Column("id", sql.Integer, primary_key = True, autoincrement=True),
    sql.Column("model_provider", sql.String, nullable = True ),
    sql.Column("model_name", sql.String, nullable = True ),
    sql.Column("api_version", sql.String, nullable = True ),
    sql.Column("api_endpoint", sql.String, nullable = True ),
    sql.Column("api_key", sql.String, nullable = True ),
    sql.Column("description", sql.String, nullable = True),
)

def insert_agent(model_provider, model_name, api_version, api_endpoint, api_key, description):
    metadata.create_all(engine)
    
    # res_count = len(fetch_all_agents())
    
    insert_query = agent_list_table.insert().values(
        # id = res_count + 1,
        model_provider = model_provider, 
        model_name = model_name, 
        api_version = api_version, 
        api_endpoint = api_endpoint, 
        api_key = api_key, 
        description = description
    )
    
    res = connection.execute(insert_query)
    connection.commit()
    # return res_count + 1
    
def fetch_agent_by_id(id):
    metadata.create_all(engine)
    select_query = sql.select(agent_list_table).where(agent_list_table.c.id == id)
    result = connection.execute(select_query)
    return result.fetchone()


def fetch_all_agents():
    metadata.create_all(engine)
    select_query = sql.select(agent_list_table)
    result = connection.execute(select_query)
    return result.fetchall()

def delete_selected_agent(id):
    metadata.create_all(engine)
    
    delete_query = agent_list_table.delete().where(agent_list_table.c.id == id)
    res = connection.execute(delete_query)
    connection.commit()
    
    