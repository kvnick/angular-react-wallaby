import { shallow } from 'enzyme';
import React from 'react';
import App from './App';

describe('App', () => {
  it("should render", () => {
    const component = shallow(<App title="Hello World!" />);
    expect(component.find('h1').text()).toBe('Hello World!');
  })
})
